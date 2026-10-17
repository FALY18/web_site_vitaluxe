import type { ModePaiement, VenteDetail } from '@/features/sell/types'

export type CompanyProfile = {
  nom: string
  adresse: string | null
  telephone: string | null
  nif: string | null
  stat: string | null
  toleranceMesureM: string | null
}

export type PaiementRow = { id: number; date: string; montant: string; mode: ModePaiement }
export type PaymentSummary = { paiements: PaiementRow[]; montantPaye: number; resteAPayer: number }

export type ProformaInvoiceData = {
  reglements: PaymentSummary
  statut: 'brouillon' | 'emise' | 'partielle' | 'payee' | 'annulee'
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
