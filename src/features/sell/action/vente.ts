'use server'

import { db } from '@/db'
import { vente, facture, paiement, ligneVente, client, mouvementStock, plateau, article, articleVitreDetail, articleAluDetail, parametreSociete } from '@/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import { calculateInvoiceTotals } from '@/features/invoice/models/invoice'
import { SaleError, positiveInteger, decimal, dimension, lineAmounts, modesForArticle, cutFits, cutQuantity, canTransition, paymentMethod, paymentOutcome, validPaymentDate, surfaceAfterSale, surfaceAfterRestoration } from '../lib/rules'
import { verifyPaymentToken } from '@/features/invoice/lib/payment-token'
import type { VenteFormState, LigneFormState, ModeLigne, VenteOptionsFormState, StatutVente } from '../types'

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

async function salesUser() {
  const session = await getSession()
  if (!session || !['admin', 'commercial'].includes(session.role)) throw new SaleError('Accès réservé aux administrateurs et commerciaux.')
  return session
}

function refresh(id?: number) {
  revalidatePath('/ventes')
  revalidatePath('/plateaux')
  revalidatePath('/stock')
  if (id) revalidatePath(`/ventes/${id}`)
}

function formError(error: unknown) {
  if (error instanceof SaleError) return { error: error.message }
  console.error('Sale operation failed', error)
  return { error: 'Opération impossible. Aucune modification enregistrée. Vérifiez les données et réessayez.' }
}

async function lockSale(tx: Transaction, id: number) {
  positiveInteger(id, 'Vente')
  const [row] = await tx.select().from(vente).where(eq(vente.id, id)).for('update')
  if (!row) throw new SaleError('Vente introuvable.')
  return row
}

async function recalculate(tx: Transaction, id: number) {
  await tx.execute(sql`UPDATE vente SET total = (SELECT COALESCE(SUM(montant), 0) FROM ligne_vente WHERE vente_id = ${id} AND annulee = false) WHERE id = ${id}`)
}

// Restore only the net quantity actually removed, using the immutable stock ledger.
// The current stock is locked, so removing an older cut cannot overwrite later cuts.
async function restoreLine(tx: Transaction, line: typeof ligneVente.$inferSelect, userId: number) {
  const [balance] = await tx.select({ quantity: sql<string>`COALESCE(SUM(${mouvementStock.quantite}), 0)` })
    .from(mouvementStock).where(eq(mouvementStock.ligneVenteId, line.id))
  const restore = -Number(balance.quantity)
  if (restore <= 0) return
  let stockAfter: string
  if (line.plateauId) {
    const [sheet] = await tx.select().from(plateau).where(eq(plateau.id, line.plateauId)).for('update')
    if (!sheet) throw new SaleError('Plateau introuvable.')
    stockAfter = surfaceAfterRestoration(sheet.surfaceRestanteM2, restore)
    await tx.update(plateau).set({ surfaceRestanteM2: stockAfter, statut: 'disponible' }).where(eq(plateau.id, sheet.id))
  } else {
    const [alu] = await tx.select().from(articleAluDetail).where(eq(articleAluDetail.articleId, line.articleId)).for('update')
    if (!alu) throw new SaleError('Stock aluminium introuvable.')
    stockAfter = String(alu.stockBarres + restore)
    await tx.update(articleAluDetail).set({ stockBarres: Number(stockAfter) }).where(eq(articleAluDetail.articleId, line.articleId))
  }
  await tx.insert(mouvementStock).values({ articleId: line.articleId, plateauId: line.plateauId, ligneVenteId: line.id, utilisateurId: userId, type: 'annulation', quantite: restore.toFixed(2), stockApres: stockAfter, motif: `Annulation de la ligne ${line.id}` })
}

export async function createVente(_prev: VenteFormState, data: FormData): Promise<VenteFormState> {
  try {
    const user = await salesUser()
    const nom = String(data.get('clientNom') ?? '').trim()
    const telephone = String(data.get('clientTel') ?? '').trim() || null
    const date = String(data.get('date') || new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Antananarivo' }).format(new Date()))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) throw new SaleError('Date invalide.')
    const id = await db.transaction(async tx => {
      let clientId = Number(data.get('clientId'))
      if (data.get('clientId')) {
        positiveInteger(clientId, 'Client')
        const [existing] = await tx.select({ id: client.id }).from(client).where(eq(client.id, clientId))
        if (!existing) throw new SaleError('Client introuvable.')
      } else {
        if (!nom || nom.length > 150 || (telephone?.length ?? 0) > 30) throw new SaleError('Nom requis (150 caractères maximum), téléphone limité à 30 caractères.')
        // Never merge different people solely because their names match.
        const [created] = await tx.insert(client).values({ nom, telephone }).returning({ id: client.id })
        clientId = created.id
      }
      const [created] = await tx.insert(vente).values({ clientId, commercialId: user.id, date }).returning({ id: vente.id })
      return created.id
    })
    refresh(id)
    return { success: true, venteId: id }
  } catch (error) { return formError(error) }
}

export async function addLigne(_prev: LigneFormState, data: FormData): Promise<LigneFormState> {
  try {
    const user = await salesUser()
    const venteId = positiveInteger(Number(data.get('venteId')), 'Vente')
    const articleId = positiveInteger(Number(data.get('articleId')), 'Article')
    const nombre = positiveInteger(Number(data.get('nombre')), 'Nombre')
    const mode = String(data.get('mode')) as ModeLigne
    const stockResult = await db.transaction(async tx => {
      const sale = await lockSale(tx, venteId)
      if (sale.statut !== 'brouillon') throw new SaleError('Seul un brouillon peut recevoir des articles.')
      const [item] = await tx.select().from(article).where(eq(article.id, articleId)).for('share')
      if (!item) throw new SaleError('Article introuvable.')
      const [glass] = await tx.select().from(articleVitreDetail).where(eq(articleVitreDetail.articleId, articleId))
      if (!modesForArticle(item.type, glass?.prixPlateauGros != null).includes(mode)) throw new SaleError('Mode de vente incompatible avec cet article.')
      let price = item.prixVente
      let quantity = nombre
      let sheetId: number | null = null
      let length: string | null = null
      let height: string | null = null
      let stockAfter: string | null = null
      let stockQuantity = 0
      if (item.type === 'vitre') {
        if (!glass) throw new SaleError('Configuration vitre manquante.')
        sheetId = positiveInteger(Number(data.get('plateauId')), 'Plateau')
        const [sheet] = await tx.select().from(plateau).where(eq(plateau.id, sheetId)).for('update')
        if (!sheet || sheet.articleId !== articleId || sheet.statut !== 'disponible') throw new SaleError('Choisissez un plateau disponible correspondant à cet article.')
        const remaining = Number(sheet.surfaceRestanteM2)
        if (mode === 'decoupe') {
          const l = dimension(data.get('longueurM'), 'Longueur')
          const h = dimension(data.get('hauteurM'), 'Hauteur')
          const [settings] = await tx.select().from(parametreSociete).limit(1)
          if (!cutFits(l, h, Number(sheet.longueurOrigineM), Number(sheet.hauteurOrigineM), Number(settings?.toleranceMesureM ?? '0.005'))) throw new SaleError('Dimensions supérieures à celles du plateau, même après rotation.')
          length = l.toFixed(3)
          height = h.toFixed(3)
          quantity = cutQuantity(l, h, nombre)
          stockQuantity = quantity
          if (quantity > remaining) throw new SaleError(`Surface insuffisante : ${remaining} m² disponibles.`)
        } else {
          if (nombre !== 1) throw new SaleError('Un seul plateau est autorisé par ligne.')
          const original = Number((Number(sheet.longueurOrigineM) * Number(sheet.hauteurOrigineM)).toFixed(2))
          if (remaining !== original) throw new SaleError('Ce plateau a déjà été découpé. Il ne peut pas être vendu entier.')
          stockQuantity = remaining
          price = mode === 'plateau_gros' ? glass.prixPlateauGros! : glass.prixPlateauEntier
        }
        stockAfter = surfaceAfterSale(sheet.surfaceRestanteM2, stockQuantity)
        await tx.update(plateau).set({ surfaceRestanteM2: stockAfter, statut: mode !== 'decoupe' ? 'vendu_entier' : Number(stockAfter) === 0 ? 'epuise' : 'disponible' }).where(eq(plateau.id, sheetId))
      } else if (item.type === 'alu') {
        const [alu] = await tx.select().from(articleAluDetail).where(eq(articleAluDetail.articleId, articleId)).for('update')
        if (!alu) throw new SaleError('Configuration aluminium manquante.')
        price = mode === 'pack' ? alu.prixPack : item.prixVente
        stockQuantity = nombre * (mode === 'pack' ? alu.nombreParPack : 1)
        if (stockQuantity > alu.stockBarres) throw new SaleError(`Stock insuffisant : ${alu.stockBarres} barres disponibles.`)
        if (stockQuantity > 99999999.99 || alu.stockBarres - stockQuantity > 99999999.99) throw new SaleError('Le mouvement dépasse la capacité du registre de stock (numeric 10,2).')
        stockAfter = String(alu.stockBarres - stockQuantity)
        await tx.update(articleAluDetail).set({ stockBarres: Number(stockAfter) }).where(eq(articleAluDetail.articleId, articleId))
      } else if (data.get('prixApplique')) {
        price = decimal(data.get('prixApplique'), 'Prix').toFixed(2)
      }
      const amounts = lineAmounts(quantity, price)
      const [line] = await tx.insert(ligneVente).values({ venteId, articleId, plateauId: sheetId, mode, nombre, longueurM: length, hauteurM: height, prixApplique: price, ...amounts, surfaceRestanteApres: sheetId ? stockAfter : null }).returning()
      if (stockAfter != null) await tx.insert(mouvementStock).values({ articleId, plateauId: sheetId, ligneVenteId: line.id, utilisateurId: user.id, type: 'vente', quantite: (-stockQuantity).toFixed(2), stockApres: stockAfter, motif: `Bon ${sale.numero} · ${mode}` })
      await recalculate(tx, venteId)
      return sheetId && stockAfter != null ? { plateauId: sheetId, surfaceRestanteM2: stockAfter } : {}
    })
    refresh(venteId)
    return { success: true, ...stockResult }
  } catch (error) { return formError(error) }
}

export async function deleteLigne(ligneId: number, venteId: number): Promise<LigneFormState> {
  try {
  const user = await salesUser()
  await db.transaction(async tx => {
    const sale = await lockSale(tx, venteId)
    if (sale.statut !== 'brouillon') throw new SaleError('Seul un brouillon peut être modifié.')
    const [line] = await tx.select().from(ligneVente).where(and(eq(ligneVente.id, ligneId), eq(ligneVente.venteId, venteId), eq(ligneVente.annulee, false))).for('update')
    if (!line) return
    await restoreLine(tx, line, user.id)
    await tx.update(ligneVente).set({ annulee: true }).where(eq(ligneVente.id, ligneId))
    await recalculate(tx, venteId)
  })
  refresh(venteId)
  return { success: true }
  } catch (error) { return formError(error) }
}

async function changeStatus(id: number, statut: StatutVente, onlyDraft = false) {
  const user = await salesUser()
  await db.transaction(async tx => {
    const sale = await lockSale(tx, id)
    if (sale.statut === statut) return
    if (onlyDraft && sale.statut !== 'brouillon') throw new SaleError('Seul un brouillon peut être retiré.')
    if (!canTransition(sale.statut, statut)) throw new SaleError('Transition de statut interdite.')
    const lines = await tx.select().from(ligneVente).where(and(eq(ligneVente.venteId, id), eq(ligneVente.annulee, false))).orderBy(ligneVente.id)
    if (statut === 'confirmee' && lines.length === 0) throw new SaleError('Ajoutez au moins un article avant de confirmer.')
    if (statut === 'annulee') {
      const invoices = await tx.select().from(facture).where(eq(facture.venteId, id)).for('update')
      if (invoices.some(invoice => invoice.statut !== 'brouillon' && invoice.statut !== 'annulee')) throw new SaleError('Une facture émise nécessite un traitement comptable avant annulation.')
      for (const line of lines) await restoreLine(tx, line, user.id)
      await tx.update(facture).set({ statut: 'annulee' }).where(eq(facture.venteId, id))
    }
    await tx.update(vente).set({ statut }).where(eq(vente.id, id))
  })
  refresh(id)
}

export async function updateStatutVente(id: number, statut: StatutVente): Promise<LigneFormState> {
  try {
    await changeStatus(id, statut)
    return { success: true }
  } catch (error) { return formError(error) }
}

// An archived cancellation keeps the immutable stock ledger and sale numbers intact.
export async function deleteVente(id: number): Promise<LigneFormState> {
  try {
    await changeStatus(id, 'annulee', true)
    return { success: true }
  } catch (error) { return formError(error) }
}

export async function updateVenteOptions(venteId: number, _prev: VenteOptionsFormState, data: FormData): Promise<VenteOptionsFormState> {
  try {
    const user = await salesUser()
    const modeRemise = data.get('modeRemise')
    if (modeRemise !== 'pourcentage' && modeRemise !== 'montant') throw new SaleError('Mode de remise invalide.')
    const valeurRemise = decimal(data.get('valeurRemise'), 'Remise')
    const fraisLivraison = decimal(data.get('fraisLivraison'), 'Livraison')
    const encaisser = data.get('encaisser') === 'on'
    const receipt = encaisser ? {
      id: await verifyPaymentToken(data.get('paymentToken'), venteId, user.id),
      mode: paymentMethod(data.get('modePaiement')),
      montant: decimal(data.get('montantRecu'), 'Montant reçu').toFixed(2),
      date: validPaymentDate(data.get('datePaiement')),
    } : null
    await db.transaction(async tx => {
      const sale = await lockSale(tx, venteId)
      if (!['confirmee', 'livree'].includes(sale.statut)) throw new SaleError('Confirmez la vente avant de régler la facturation.')
      if ((modeRemise === 'pourcentage' && valeurRemise > 100) || (modeRemise === 'montant' && valeurRemise > Number(sale.total))) throw new SaleError('La remise dépasse le montant autorisé.')
      const invoices = await tx.select().from(facture).where(eq(facture.venteId, venteId)).for('update')
      if (invoices.length > 1) throw new SaleError('Plusieurs factures existent pour cette vente. Vérifiez le dossier.')
      let invoice = invoices[0]
      if (invoice?.statut === 'annulee') throw new SaleError('Cette facture est annulée.')
      if (receipt) {
        const [existing] = await tx.select().from(paiement).where(eq(paiement.id, receipt.id))
        if (existing) {
          if (existing.factureId !== invoice?.id || existing.mode !== receipt.mode || existing.montant !== receipt.montant || existing.date !== receipt.date) throw new SaleError('Cette référence de règlement a déjà été utilisée.')
          return // Retry of the same request: never record a receipt twice.
        }
      }
      const locked = invoice && invoice.statut !== 'brouillon'
      if (locked && (invoice.modeRemise !== modeRemise || Number(invoice.valeurRemise) !== valeurRemise || Number(invoice.fraisLivraison) !== fraisLivraison)) throw new SaleError('Les conditions d’une facture émise ne peuvent plus être modifiées.')
      const totals = calculateInvoiceTotals(sale.total, modeRemise, valeurRemise, fraisLivraison)
      if (totals.totalTtc > 999999999999.99) throw new SaleError('Total supérieur à la limite autorisée.')
      if (!locked) {
        const [received] = invoice ? await tx.select({ total: sql<string>`COALESCE(SUM(${paiement.montant}), 0)` }).from(paiement).where(eq(paiement.factureId, invoice.id)) : []
        if (received && Number(received.total) > 0) throw new SaleError('Une facture brouillon possède déjà des règlements. Vérifiez le dossier.')
        await tx.update(vente).set({ modeRemise, valeurRemise: valeurRemise.toFixed(2), fraisLivraison: fraisLivraison.toFixed(2) }).where(eq(vente.id, venteId))
        const snapshot = { caissierId: user.id, sousTotalHt: totals.sousTotalHt.toFixed(2), modeRemise: totals.modeRemise, valeurRemise: valeurRemise.toFixed(2), montantRemise: totals.montantRemise.toFixed(2), fraisLivraison: fraisLivraison.toFixed(2), totalHt: totals.totalHt.toFixed(2), montantTva: '0', totalTtc: totals.totalTtc.toFixed(2) }
        if (invoice) [invoice] = await tx.update(facture).set(snapshot).where(eq(facture.id, invoice.id)).returning()
        else if (receipt) [invoice] = await tx.insert(facture).values({ ...snapshot, venteId, statut: 'brouillon' }).returning()
      }
      if (receipt && invoice) {
        const [received] = await tx.select({ total: sql<string>`COALESCE(SUM(${paiement.montant}), 0)` }).from(paiement).where(eq(paiement.factureId, invoice.id))
        const outcome = paymentOutcome(invoice.totalTtc, received.total, receipt.montant)
        await tx.insert(paiement).values({ ...receipt, factureId: invoice.id })
        await tx.update(facture).set({ statut: outcome.statut, caissierId: user.id }).where(eq(facture.id, invoice.id))
      }
    })
    refresh(venteId)
    return { success: true }
  } catch (error) { return formError(error) }
}
