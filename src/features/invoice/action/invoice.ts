'use server'

import { db } from '@/db'
import { facture, vente } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import { calculateInvoiceTotals } from '../models/invoice'
import { SaleError } from '@/features/sell/lib/rules'
import type { LigneFormState } from '@/features/sell/types'

async function saveInvoice(venteId: number, final: boolean) {
  const user = await getSession()
  if (!user || !['admin', 'commercial'].includes(user.role)) throw new SaleError('Accès non autorisé.')
  await db.transaction(async tx => {
    // Same first lock as all sale mutations: invoice emission and commercial changes serialize.
    const [sale] = await tx.select().from(vente).where(eq(vente.id, venteId)).for('update')
    if (!sale || !['confirmee', 'livree'].includes(sale.statut)) throw new SaleError('Confirmez la vente avant de créer une facture.')
    const invoices = await tx.select().from(facture).where(eq(facture.venteId, venteId)).for('update')
    if (invoices.length > 1) throw new SaleError('Plusieurs factures existent pour cette vente. Vérifiez le dossier avant de continuer.')
    const existing = invoices[0]
    // Never rewrite an issued, partially paid, paid or cancelled invoice.
    if (existing && existing.statut !== 'brouillon') return
    const totals = calculateInvoiceTotals(sale.total, sale.modeRemise, sale.valeurRemise, sale.fraisLivraison)
    const values = {
      caissierId: user.id,
      sousTotalHt: totals.sousTotalHt.toFixed(2),
      modeRemise: totals.modeRemise,
      valeurRemise: totals.valeurRemise.toFixed(2),
      montantRemise: totals.montantRemise.toFixed(2),
      fraisLivraison: totals.fraisLivraison.toFixed(2),
      totalHt: totals.totalHt.toFixed(2),
      montantTva: totals.montantTva.toFixed(2),
      totalTtc: totals.totalTtc.toFixed(2),
      statut: final ? (totals.totalTtc === 0 ? 'payee' as const : 'emise' as const) : 'brouillon' as const,
    }
    if (existing) await tx.update(facture).set(values).where(eq(facture.id, existing.id))
    else await tx.insert(facture).values({ ...values, venteId })
  })
  revalidatePath(`/ventes/${venteId}`)
}

export async function createProformaInvoice(venteId: number): Promise<LigneFormState> {
  try {
    await saveInvoice(venteId, false)
    return { success: true }
  } catch (error) {
    return { error: error instanceof SaleError ? error.message : 'La facture n’a pas pu être enregistrée.' }
  }
}

export async function createFinalInvoice(venteId: number): Promise<LigneFormState> {
  try {
    await saveInvoice(venteId, true)
    return { success: true }
  } catch (error) {
    return { error: error instanceof SaleError ? error.message : 'La facture n’a pas pu être émise.' }
  }
}
