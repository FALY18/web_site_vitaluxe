import type { VenteDetail } from '@/features/sell/types'

export type CompanyProfile = {
  nom: string
  adresse: string | null
  telephone: string | null
  nif: string | null
  stat: string | null
  toleranceMesureM: string | null
}

export type ProformaInvoiceData = {
  numero: string
  vente: VenteDetail
  company: CompanyProfile
  totals: {
    sousTotalHt: number
    modeRemise: 'pourcentage' | 'montant'
    valeurRemise: number
    montantRemise: number
    fraisLivraison: number
    totalHt: number
    montantTva: number
    totalTtc: number
  }
  caissierNom: string
}
