'use server'

import { db } from '@/db'
import { facture, vente } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import { calculateInvoiceTotals } from '../models/invoice'

async function getVenteStatut(venteId: number): Promise<'brouillon' | 'confirmee' | 'livree' | 'annulee' | null> {
  const [venteData] = await db
    .select({ statut: vente.statut })
    .from(vente)
    .where(eq(vente.id, venteId))
    .limit(1)

  return venteData?.statut ?? null
}

export async function createProformaInvoice(venteId: number): Promise<void> {
  const session = await getSession()
  if (!session) return

  const statutVente = await getVenteStatut(venteId)
  if (statutVente !== 'confirmee' && statutVente !== 'livree') return

  const [existing] = await db
    .select({ id: facture.id, statut: facture.statut })
    .from(facture)
    .where(eq(facture.venteId, venteId))
    .limit(1)

  const [venteData] = await db
    .select({
      total: vente.total,
      modeRemise: vente.modeRemise,
      valeurRemise: vente.valeurRemise,
      fraisLivraison: vente.fraisLivraison,
    })
    .from(vente)
    .where(eq(vente.id, venteId))
    .limit(1)

  if (!venteData) return

  if (existing?.statut === 'emise') {
    revalidatePath(`/dashboard/ventes/${venteId}`)
    return
  }

  const totals = calculateInvoiceTotals(
    venteData.total ?? 0,
    venteData.modeRemise,
    venteData.valeurRemise,
    venteData.fraisLivraison,
  )

  if (existing) {
    await db.update(facture).set({
      caissierId: session.id,
      sousTotalHt: totals.sousTotalHt.toFixed(2),
      modeRemise: totals.modeRemise,
      valeurRemise: totals.valeurRemise.toFixed(2),
      montantRemise: totals.montantRemise.toFixed(2),
      fraisLivraison: totals.fraisLivraison.toFixed(2),
      totalHt: totals.totalHt.toFixed(2),
      montantTva: '0',
      totalTtc: totals.totalTtc.toFixed(2),
    }).where(eq(facture.id, existing.id))
    revalidatePath(`/dashboard/ventes/${venteId}`)
    return
  }

  await db.insert(facture).values({
    venteId,
    caissierId: session.id,
    dateEmission: new Date().toISOString().slice(0, 10),
    sousTotalHt: totals.sousTotalHt.toFixed(2),
    modeRemise: totals.modeRemise,
    valeurRemise: totals.valeurRemise.toFixed(2),
    montantRemise: totals.montantRemise.toFixed(2),
    fraisLivraison: totals.fraisLivraison.toFixed(2),
    totalHt: totals.totalHt.toFixed(2),
    montantTva: totals.montantTva.toFixed(2),
    totalTtc: totals.totalTtc.toFixed(2),
    statut: 'brouillon',
  })

  revalidatePath(`/dashboard/ventes/${venteId}`)
}

export async function createFinalInvoice(venteId: number): Promise<void> {
  const session = await getSession()
  if (!session) return

  const statutVente = await getVenteStatut(venteId)
  if (statutVente !== 'confirmee' && statutVente !== 'livree') return

  const [existing] = await db
    .select({ id: facture.id, statut: facture.statut })
    .from(facture)
    .where(eq(facture.venteId, venteId))
    .limit(1)

  const [venteData] = await db
    .select({
      total: vente.total,
      modeRemise: vente.modeRemise,
      valeurRemise: vente.valeurRemise,
      fraisLivraison: vente.fraisLivraison,
    })
    .from(vente)
    .where(eq(vente.id, venteId))
    .limit(1)

  if (!venteData) return

  const totals = calculateInvoiceTotals(
    venteData.total ?? 0,
    venteData.modeRemise,
    venteData.valeurRemise,
    venteData.fraisLivraison,
  )

  if (existing) {
    await db
      .update(facture)
      .set({
        statut: 'emise',
        caissierId: session.id,
        sousTotalHt: totals.sousTotalHt.toFixed(2),
        modeRemise: totals.modeRemise,
        valeurRemise: totals.valeurRemise.toFixed(2),
        montantRemise: totals.montantRemise.toFixed(2),
        fraisLivraison: totals.fraisLivraison.toFixed(2),
        totalHt: totals.totalHt.toFixed(2),
        montantTva: totals.montantTva.toFixed(2),
        totalTtc: totals.totalTtc.toFixed(2),
      })
      .where(eq(facture.id, existing.id))
  } else {
    await db.insert(facture).values({
      venteId,
      caissierId: session.id,
      dateEmission: new Date().toISOString().slice(0, 10),
      sousTotalHt: totals.sousTotalHt.toFixed(2),
      modeRemise: totals.modeRemise,
      valeurRemise: totals.valeurRemise.toFixed(2),
      montantRemise: totals.montantRemise.toFixed(2),
      fraisLivraison: totals.fraisLivraison.toFixed(2),
      totalHt: totals.totalHt.toFixed(2),
      montantTva: totals.montantTva.toFixed(2),
      totalTtc: totals.totalTtc.toFixed(2),
      statut: 'emise',
    })
  }

  revalidatePath(`/dashboard/ventes/${venteId}`)
}
