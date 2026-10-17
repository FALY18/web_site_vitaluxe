import { db } from '@/db'
import { facture, paiement, parametreSociete, utilisateur } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { paymentBalance } from '@/features/sell/lib/rules'
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

  if (!row) return null
  const paiements = await db.select({ id: paiement.id, date: paiement.date, montant: paiement.montant, mode: paiement.mode })
    .from(paiement).where(eq(paiement.factureId, row.id)).orderBy(asc(paiement.date), asc(paiement.id))
  const paidCents = paiements.reduce((sum, receipt) => sum + Math.round(Number(receipt.montant) * 100), 0)
  return { ...row, reglements: { paiements, ...paymentBalance(row.totalTtc, (paidCents / 100).toFixed(2)) } }
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
    vente,    statut: factureData?.statut ?? 'brouillon',
    reglements: factureData?.reglements ?? { paiements: [], montantPaye: 0, resteAPayer: totals.totalTtc },

    company: buildCompanyProfile(company),
    totals,
    caissierNom: caissierNom ?? vente.commercialNom,
  }
}
