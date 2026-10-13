import { db } from '@/db'
import { facture, parametreSociete, utilisateur } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getVenteById } from '@/features/sell/queries/vente'
import { buildCompanyProfile, buildProformaNumber, calculateInvoiceTotals } from '../models/invoice'
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
      sousTotalHt: facture.sousTotalHt,
      modeRemise: facture.modeRemise,
      valeurRemise: facture.valeurRemise,
      montantRemise: facture.montantRemise,
      fraisLivraison: facture.fraisLivraison,
      caissierNom: utilisateur.nom,
    })
    .from(facture)
    .leftJoin(utilisateur, eq(facture.caissierId, utilisateur.id))
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

  const sourceTotals = factureData ?? {
    sousTotalHt: vente.total,
    modeRemise: vente.modeRemise,
    valeurRemise: vente.valeurRemise,
    fraisLivraison: vente.fraisLivraison,
    caissierNom: vente.commercialNom,
  }
  const { caissierNom, ...invoiceInputs } = sourceTotals
  const totals = {
    ...calculateInvoiceTotals(
      invoiceInputs.sousTotalHt,
      invoiceInputs.modeRemise,
      invoiceInputs.valeurRemise,
      invoiceInputs.fraisLivraison,
    ),
    ...(factureData ? {
      totalHt: Number(factureData.totalHt),
      montantTva: Number(factureData.montantTva),
      totalTtc: Number(factureData.totalTtc),
      montantRemise: Number(factureData.montantRemise),
    } : {}),
  }

  return {
    numero: buildProformaNumber(
      vente.numero,
      factureData?.numero ?? null,
    ),
    vente,
    company: buildCompanyProfile(company),
    totals,
    caissierNom: caissierNom ?? vente.commercialNom,
  }
}
