import type { CompanyProfile } from '../types'

export function buildCompanyProfile(raw: {
  nom: string | null
  adresse: string | null
  telephone: string | null
  nif: string | null
  stat: string | null
  toleranceMesureM: string | number | null
}): CompanyProfile {
  return {
    nom: raw.nom ?? 'VITALUXE',
    adresse: raw.adresse ?? '',
    telephone: raw.telephone ?? '',
    nif: raw.nif ?? '',
    stat: raw.stat ?? '',
    toleranceMesureM: raw.toleranceMesureM?.toString() ?? '0.005',
  }
}

export function buildProformaNumber(venteNumero: number, savedNumero?: string | null) {
  if (savedNumero) {
    return savedNumero.startsWith('FAC-')
      ? savedNumero
      : `FAC-${savedNumero}`
  }

  return `PF-${String(venteNumero).padStart(4, '0')}`
}

export function calculateInvoiceTotals(
  total: string | number,
  modeRemise: 'pourcentage' | 'montant' = 'pourcentage',
  valeurRemise: string | number = 0,
  fraisLivraison: string | number = 0,
) {
  const sousTotalHt = Number(total ?? 0)
  const valeur = Number(valeurRemise ?? 0)
  const remiseDemandee = modeRemise === 'pourcentage'
    ? sousTotalHt * valeur / 100
    : valeur
  const montantRemise = Number(Math.min(sousTotalHt, remiseDemandee).toFixed(2))
  const totalHt = Number((Math.max(0, sousTotalHt - montantRemise) + Number(fraisLivraison ?? 0)).toFixed(2))
  const montantTva = 0
  const totalTtc = totalHt

  return {
    sousTotalHt,
    modeRemise,
    valeurRemise: valeur,
    montantRemise,
    fraisLivraison: Number(fraisLivraison ?? 0),
    totalHt,
    montantTva,
    totalTtc,
  }
}
