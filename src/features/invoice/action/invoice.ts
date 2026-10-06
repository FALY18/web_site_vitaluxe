'use server'

import { db } from '@/db'
import { facture, vente } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import { calculateInvoiceTotals } from '../models/invoice'

export async function createProformaInvoice(venteId: number): Promise<void> {
  const session = await getSession()
  if (!session) return

  const [existing] = await db
    .select({ id: facture.id })
    .from(facture)
    .where(eq(facture.venteId, venteId))
    .limit(1)

  if (existing) {
    revalidatePath(`/dashboard/ventes/${venteId}`)
    return
  }

  const [venteData] = await db
    .select({ total: vente.total })
    .from(vente)
    .where(eq(vente.id, venteId))
    .limit(1)

  if (!venteData) return

  const totals = calculateInvoiceTotals(venteData.total ?? 0)

  await db.insert(facture).values({
    venteId,
    dateEmission: new Date().toISOString().slice(0, 10),
    totalHt: totals.totalHt.toFixed(2),
    montantTva: totals.montantTva.toFixed(2),
    totalTtc: totals.totalTtc.toFixed(2),
    statut: 'brouillon',
  })

  revalidatePath(`/dashboard/ventes/${venteId}`)
}
