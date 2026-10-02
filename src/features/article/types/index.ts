export type TypeArticle = 'vitre' | 'alu' | 'accessoire' | 'service'
export type UniteVente = 'm2' | 'barre' | 'unite' | 'forfait' | 'heure'

export type ArticleRow = {
  id: number
  code: string
  designation: string
  categorieId: number
  categorieNom: string
  type: TypeArticle
  couleur: string | null
  uniteVente: UniteVente
  prixVente: string
}

export type VitreDetail = {
  epaisseurMm: string
  prixPlateauEntier: string
  prixPlateauGros: string | null
}

export type AluDetail = {
  prixPack: string
  nombreParPack: number
  stockBarres: number
  emplacement: string | null
}

export type ArticleWithDetail = ArticleRow & {
  vitreDetail?: VitreDetail | null
  aluDetail?: AluDetail | null
}

export type ArticleFormState = {
  error?: string
  success?: boolean
}

export const TYPE_LABELS: Record<TypeArticle, string> = {
  vitre: 'Vitre',
  alu: 'Aluminium',
  accessoire: 'Accessoire',
  service: 'Service',
}

export const UNITE_LABELS: Record<UniteVente, string> = {
  m2: 'm²',
  barre: 'Barre',
  unite: 'Unité',
  forfait: 'Forfait',
  heure: 'Heure',
}

// Unités autorisées par type
export const TYPE_UNITES: Record<TypeArticle, UniteVente[]> = {
  vitre:      ['m2'],
  alu:        ['barre', 'unite'],
  accessoire: ['unite', 'forfait'],
  service:    ['forfait', 'heure'],
}

export const TYPE_UNITE_DEFAULT: Record<TypeArticle, UniteVente> = {
  vitre:      'm2',
  alu:        'barre',
  accessoire: 'unite',
  service:    'forfait',
}
