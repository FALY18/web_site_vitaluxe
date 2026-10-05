'use server'

import { db } from '@/db'
import { vente, ligneVente, client, mouvementStock, plateau } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import { getArticleForSale, getPlateauById } from '../queries/vente'
import type { VenteFormState, LigneFormState, ModeLigne } from '../types'

// ── Créer ou trouver un client à la volée ──────────────────────────────
async function upsertClient(nom: string, telephone: string | null): Promise<number> {
  const existing = await db.select({ id: client.id }).from(client)
    .where(eq(client.nom, nom)).limit(1)
  if (existing.length > 0) return existing[0].id
  const [c] = await db.insert(client).values({ nom, telephone }).returning({ id: client.id })
  return c.id
}

// ── Créer une vente (brouillon) ────────────────────────────────────────
export async function createVente(
  _prev: VenteFormState,
  formData: FormData
): Promise<VenteFormState> {
  const session = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const clientIdRaw = formData.get('clientId') as string
  const clientNom = (formData.get('clientNom') as string)?.trim()
  const clientTel = (formData.get('clientTel') as string)?.trim() || null
  const date = (formData.get('date') as string) || new Date().toISOString().slice(0, 10)

  let clientId: number
  if (clientIdRaw && clientIdRaw !== '') {
    clientId = Number(clientIdRaw)
  } else {
    if (!clientNom) return { error: 'Le nom du client est requis.' }
    clientId = await upsertClient(clientNom, clientTel)
  }

  const [v] = await db
    .insert(vente)
    .values({ numero: 0, clientId, commercialId: session.id, date, statut: 'brouillon', total: '0' })
    .returning({ id: vente.id })

  revalidatePath('/dashboard/ventes')
  return { success: true, venteId: v.id }
}

// ── Ajouter une ligne ──────────────────────────────────────────────────
export async function addLigne(
  _prev: LigneFormState,
  formData: FormData,
): Promise<LigneFormState> {
  const session = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const venteId = Number(formData.get('venteId'))
  const articleId = Number(formData.get('articleId'))
  const mode = formData.get('mode') as ModeLigne
  const nombre = Number(formData.get('nombre'))
  const prixAppliqueRaw = formData.get('prixApplique') as string
  const plateauId = formData.get('plateauId') ? Number(formData.get('plateauId')) : null
  const longueurM = formData.get('longueurM') ? (formData.get('longueurM') as string) : null
  const hauteurM = formData.get('hauteurM') ? (formData.get('hauteurM') as string) : null

  if (!venteId || !articleId || !mode || !nombre) {
    return { error: 'Champs obligatoires manquants.' }
  }

  // ── Article avec détail pour auto-calcul du prix ─────────────────────
  const articleData = await getArticleForSale(articleId)
  if (!articleData) {
    return { error: 'Article introuvable.' }
  }

  const isVitre = articleData.type === 'vitre'
  const isPlateauMode = ['decoupe', 'plateau_entier', 'plateau_gros'].includes(mode)

  // ════════════════════════════════════════════════════════════════════
  // Auto-calcul du prix selon le type d'article et le mode de vente
  // ════════════════════════════════════════════════════════════════════
  let prixApplique: string
  let quantiteFacturee: string
  let montant: string
  let surfaceAVendre: number = 0
  let surfaceRestanteApres: string | null = null

  if (isVitre && isPlateauMode) {
    // --- VITRE : le prix est calculé automatiquement ---
    const vd = articleData.vitreDetail
    if (!vd) return { error: 'Détails vitre manquants pour cet article.' }

    if (mode === 'decoupe') {
      if (!longueurM || !hauteurM) {
        return { error: 'Les dimensions sont requises pour une découpe.' }
      }
      const surface = Number(longueurM) * Number(hauteurM) * nombre
      if (surface <= 0) return { error: 'La surface calculée est nulle ou négative.' }

      surfaceAVendre = surface
      quantiteFacturee = surface.toFixed(2)
      prixApplique = articleData.prixVente // prix au m² stocké sur l'article
      montant = (surface * Number(prixApplique)).toFixed(2)

    } else if (mode === 'plateau_entier') {
      prixApplique = vd.prixPlateauEntier
      quantiteFacturee = nombre.toString()
      montant = (nombre * Number(prixApplique)).toFixed(2)

    } else {
      // mode === 'plateau_gros'
      if (!vd.prixPlateauGros) return { error: 'Aucun prix plateau gros défini.' }
      prixApplique = vd.prixPlateauGros
      quantiteFacturee = nombre.toString()
      montant = (nombre * Number(prixApplique)).toFixed(2)
    }

  } else {
    // --- NON-VITRE (alu / accessoire / service) ---
    prixApplique = prixAppliqueRaw || articleData.prixVente

    if (mode === 'decoupe' && longueurM && hauteurM) {
      const surface = Number(longueurM) * Number(hauteurM) * nombre
      surfaceAVendre = surface
      quantiteFacturee = surface.toFixed(2)
      montant = (surface * Number(prixApplique)).toFixed(2)
    } else {
      quantiteFacturee = nombre.toString()
      montant = (nombre * Number(prixApplique)).toFixed(2)
    }
  }

  // ── Insertion de la ligne ───────────────────────────────────────────
  const [ligne] = await db
    .insert(ligneVente)
    .values({
      venteId, articleId, plateauId, mode, nombre,
      longueurM, hauteurM, quantiteFacturee, prixApplique, montant,
    })
    .returning({ id: ligneVente.id })

  // ════════════════════════════════════════════════════════════════════
  // Gestion du stock (plateau de verre brut)
  // ════════════════════════════════════════════════════════════════════
  if (isVitre && isPlateauMode && plateauId) {
    const plateauData = await getPlateauById(plateauId)
    if (!plateauData) return { error: 'Plateau introuvable.' }

    const surfaceOrigine =
      Number(plateauData.longueurOrigineM) * Number(plateauData.hauteurOrigineM)

    if (mode === 'decoupe') {
      // Découpe : on enlève la surface découpée
      const nouvelleSurface = (Number(plateauData.surfaceRestanteM2) - surfaceAVendre).toFixed(2)
      surfaceRestanteApres = nouvelleSurface

      await db
        .update(plateau)
        .set({
          surfaceRestanteM2: nouvelleSurface,
          statut: Number(nouvelleSurface) <= 0 ? 'epuise' : 'disponible',
        })
        .where(eq(plateau.id, plateauId))

      await db.insert(mouvementStock).values({
        articleId, plateauId, ligneVenteId: ligne.id, utilisateurId: session.id,
        type: 'vente', quantite: (-surfaceAVendre).toFixed(2),
        stockApres: nouvelleSurface,
        motif: `Vente découpe ${articleData.designation} (${surfaceAVendre.toFixed(2)} m²)`,
      })

    } else {
      // plateau_entier / plateau_gros : tout le plateau est vendu
      surfaceRestanteApres = '0'

      await db
        .update(plateau)
        .set({ surfaceRestanteM2: '0', statut: 'vendu_entier' })
        .where(eq(plateau.id, plateauId))

      await db.insert(mouvementStock).values({
        articleId, plateauId, ligneVenteId: ligne.id, utilisateurId: session.id,
        type: 'vente', quantite: (-surfaceOrigine).toFixed(2),
        stockApres: '0',
        motif: `Vente ${mode === 'plateau_entier' ? 'plateau entier' : 'plateau gros'} — ${articleData.designation}`,
      })
    }

    // Mettre à jour surfaceRestanteApres sur la ligne
    await db
      .update(ligneVente)
      .set({ surfaceRestanteApres })
      .where(eq(ligneVente.id, ligne.id))
  }

  // Recalcul du total de la vente
  await db.execute(sql`
    UPDATE vente SET total = (
      SELECT COALESCE(SUM(montant), 0) FROM ligne_vente WHERE vente_id = ${venteId}
    ) WHERE id = ${venteId}
  `)

  revalidatePath(`/dashboard/ventes/${venteId}`)
  revalidatePath('/dashboard/plateaux')
  return { success: true }
}

// ── Supprimer une ligne (restaure le stock plateau si nécessaire) ────────
export async function deleteLigne(ligneId: number, venteId: number): Promise<void> {
  const session = await getSession()
  if (!session) return

  // Récupérer les infos de la ligne avant suppression
  const [ligne] = await db
    .select({
      id: ligneVente.id,
      articleId: ligneVente.articleId,
      plateauId: ligneVente.plateauId,
      mode: ligneVente.mode,
      nombre: ligneVente.nombre,
      longueurM: ligneVente.longueurM,
      hauteurM: ligneVente.hauteurM,
      quantiteFacturee: ligneVente.quantiteFacturee,
      surfaceRestanteApres: ligneVente.surfaceRestanteApres,
    })
    .from(ligneVente)
    .where(eq(ligneVente.id, ligneId))

  if (!ligne) return

  // Restaurer le stock plateau si la ligne concerne un plateau
  if (ligne.plateauId && ligne.surfaceRestanteApres != null) {
    if (ligne.surfaceRestanteApres !== '0') {
      // Cas découpe : on restaure la surface vendue au plateau
      const surfaceRestanteAvant = Number(ligne.surfaceRestanteApres)
      const surfaceOrigine = Number(ligne.quantiteFacturee)
      const surfaceRestauree = (surfaceRestanteAvant + surfaceOrigine).toFixed(2)

      await db
        .update(plateau)
        .set({
          surfaceRestanteM2: surfaceRestauree,
          statut: Number(surfaceRestauree) > 0 ? 'disponible' : 'epuise',
        })
        .where(eq(plateau.id, ligne.plateauId))

      await db.insert(mouvementStock).values({
        articleId: ligne.articleId,
        plateauId: ligne.plateauId,
        ligneVenteId: ligne.id,
        utilisateurId: session.id,
        type: 'annulation',
        quantite: surfaceOrigine.toFixed(2),
        stockApres: surfaceRestauree,
        motif: `Annulation vente découpe (ligne ${ligne.id})`,
      })
    } else {
      // Cas plateau_entier / plateau_gros : remettre le statut à disponible
      await db
        .update(plateau)
        .set({ statut: 'disponible' })
        .where(eq(plateau.id, ligne.plateauId))

      await db.insert(mouvementStock).values({
        articleId: ligne.articleId,
        plateauId: ligne.plateauId,
        ligneVenteId: ligne.id,
        utilisateurId: session.id,
        type: 'annulation',
        quantite: '0',
        stockApres: '0',
        motif: `Annulation vente ${ligne.mode} (ligne ${ligne.id})`,
      })
    }
  }

  await db.delete(ligneVente).where(eq(ligneVente.id, ligneId))

  // Recalcul du total de la vente
  await db.execute(sql`
    UPDATE vente SET total = (
      SELECT COALESCE(SUM(montant), 0) FROM ligne_vente WHERE vente_id = ${venteId}
    ) WHERE id = ${venteId}
  `)

  revalidatePath(`/dashboard/ventes/${venteId}`)
  revalidatePath('/dashboard/plateaux')
}

// ── Changer le statut d'une vente ──────────────────────────────────────
export async function updateStatutVente(
  id: number,
  statut: 'brouillon' | 'confirmee' | 'livree' | 'annulee',
): Promise<void> {
  const session = await getSession()
  if (!session) return
  await db.update(vente).set({ statut }).where(eq(vente.id, id))
  revalidatePath(`/dashboard/ventes/${id}`)
  revalidatePath('/dashboard/ventes')
}

// ── Supprimer une vente (brouillon) ─────────────────────────────────────
export async function deleteVente(id: number): Promise<void> {
  const session = await getSession()
  if (!session) return
  await db.delete(vente).where(eq(vente.id, id))
  revalidatePath('/dashboard/ventes')
}
