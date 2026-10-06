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

export function calculateInvoiceTotals(total: string | number) {
  const totalHt = Number(total ?? 0)
  const montantTva = Number((totalHt * 0.2).toFixed(2))
  const totalTtc = Number((totalHt + montantTva).toFixed(2))

  return {
    totalHt,
    montantTva,
    totalTtc,
  }
}
