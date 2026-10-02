export type UtilisateurRow = {
  id: number
  nom: string
  identifiant: string
  role: 'commercial' | 'depot' | 'admin'
}

export type UtilisateurFormState = {
  error?: string
  success?: boolean
}
