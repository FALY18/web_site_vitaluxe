export type Role = 'commercial' | 'depot' | 'admin'

export type SessionUser = {
  id: number
  nom: string
  identifiant: string
  role: Role
}

export type LoginState = {
  error?: string
  success?: boolean
}
