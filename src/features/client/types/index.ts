export type ClientRow = {
  id: number
  nom: string
  telephone: string | null
  adresse: string | null
  nbVentes?: number
}

export type ClientFormState = { error?: string; success?: boolean }
