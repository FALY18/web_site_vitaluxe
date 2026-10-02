export type StatutVente = 'brouillon' | 'confirmee' | 'livree' | 'annulee'
export type ModeLigne = 'decoupe' | 'plateau_entier' | 'plateau_gros' | 'barre' | 'pack' | 'standard'

export type VenteRow = {
  id: number
  numero: number
  date: string
  statut: StatutVente
  total: string
  clientNom: string
  commercialNom: string
}

export type LigneVenteRow = {
  id: number
  venteId: number
  articleId: number
  articleCode: string
  articleDesignation: string
  plateauId: number | null
  mode: ModeLigne
  nombre: number
  longueurM: string | null
  hauteurM: string | null
  quantiteFacturee: string
  prixApplique: string
  montant: string
}

export type VenteDetail = VenteRow & {
  clientTelephone: string | null
  lignes: LigneVenteRow[]
}

export type ClientRow = {
  id: number
  nom: string
  telephone: string | null
}

export type PlateauDisponible = {
  id: number
  articleId: number
  articleDesignation: string
  longueurOrigineM: string
  hauteurOrigineM: string
  surfaceRestanteM2: string
  emplacement: string | null
}

export type VenteFormState = { error?: string; success?: boolean; venteId?: number }
export type LigneFormState = { error?: string; success?: boolean }

export const STATUT_LABELS: Record<StatutVente, string> = {
  brouillon:  'Brouillon',
  confirmee:  'Confirmée',
  livree:     'Livrée',
  annulee:    'Annulée',
}

export const MODE_LABELS: Record<ModeLigne, string> = {
  decoupe:        'Découpe',
  plateau_entier: 'Plateau entier',
  plateau_gros:   'Plateau gros',
  barre:          'Barre',
  pack:           'Pack',
  standard:       'Standard',
}

export const STATUT_STYLE: Record<StatutVente, string> = {
  brouillon:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  confirmee:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  livree:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  annulee:    'bg-red-500/10 text-red-400 border-red-500/20',
}
