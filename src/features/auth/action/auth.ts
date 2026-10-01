'use server'

import { redirect } from 'next/navigation'
import { compare } from 'bcryptjs'
import { db } from '@/db'
import { utilisateur } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createSession, deleteSession } from '../session'
import type { LoginState } from '../types'

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const identifiant = formData.get('identifiant') as string
  const motDePasse = formData.get('motDePasse') as string

  if (!identifiant || !motDePasse) {
    return { error: 'Identifiant et mot de passe requis.' }
  }

  const [user] = await db
    .select()
    .from(utilisateur)
    .where(eq(utilisateur.identifiant, identifiant))
    .limit(1)

  if (!user) return { error: 'Identifiant ou mot de passe incorrect.' }

  const valid = await compare(motDePasse, user.motDePasseHash)
  if (!valid) return { error: 'Identifiant ou mot de passe incorrect.' }

  await createSession({
    id: user.id,
    nom: user.nom,
    identifiant: user.identifiant,
    role: user.role,
  })

  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
