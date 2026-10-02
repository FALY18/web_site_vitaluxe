export type StatutPlateau = 'disponible' | 'epuise' | 'vendu_entier'

export type PlateauRow = {
  id: number
  articleId: number
  articleCode: string
  articleDesignation: string
  longueurOrigineM: string
  hauteurOrigineM: string
  surfaceRestanteM2: string
  emplacement: string | null
  statut: StatutPlateau
}

export type PlateauFormState = { error?: string; success?: boolean }

export const STATUT_PLATEAU_STYLE: Record<StatutPlateau, string> = {
  disponible:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  epuise:       'bg-red-500/10 text-red-400 border-red-500/20',
  vendu_entier: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

export const STATUT_PLATEAU_LABELS: Record<StatutPlateau, string> = {
  disponible:   'Disponible',
  epuise:       'Épuisé',
  vendu_entier: 'Vendu entier',
}
