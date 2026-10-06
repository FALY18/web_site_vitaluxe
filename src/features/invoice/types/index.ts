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
}
