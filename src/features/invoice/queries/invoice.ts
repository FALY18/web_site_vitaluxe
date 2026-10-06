import { db } from '@/db'
import { facture, parametreSociete } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getVenteById } from '@/features/sell/queries/vente'
import { buildCompanyProfile, buildProformaNumber } from '../models/invoice'
import type { ProformaInvoiceData } from '../types'

export async function getFactureByVenteId(venteId: number) {
  const [row] = await db
    .select({
      id: facture.id,
      numero: facture.numero,
      dateEmission: facture.dateEmission,
      totalHt: facture.totalHt,
      montantTva: facture.montantTva,
      totalTtc: facture.totalTtc,
      statut: facture.statut,
    })
    .from(facture)
    .where(eq(facture.venteId, venteId))
    .limit(1)

  return row ?? null
}

export async function getProformaInvoiceData(
  venteId: number,
): Promise<ProformaInvoiceData | null> {
  const [company] = await db.select().from(parametreSociete).limit(1)
  const vente = await getVenteById(venteId)
  const factureData = await getFactureByVenteId(venteId)

  if (!company || !vente) {
    return null
  }

  return {
    numero: buildProformaNumber(
      vente.numero,
      factureData?.numero ?? null,
    ),
    vente,
    company: buildCompanyProfile(company),
  }
}
