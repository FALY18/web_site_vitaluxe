'use server'

import { db } from '@/db'
import { utilisateur } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import type { UtilisateurFormState } from '../types'

export async function createUtilisateur(
  _prev: UtilisateurFormState,
  formData: FormData
): Promise<UtilisateurFormState> {
  const session = await getSession()
  if (session?.role !== 'admin') return { error: 'Accès refusé.' }

  const nom = (formData.get('nom') as string)?.trim()
  const identifiant = (formData.get('identifiant') as string)?.trim()
  const motDePasse = formData.get('motDePasse') as string
  const role = formData.get('role') as string

  if (!nom || !identifiant || !motDePasse || !role) return { error: 'Tous les champs sont requis.' }
  if (!['commercial', 'depot', 'admin'].includes(role)) return { error: 'Rôle invalide.' }
  if (motDePasse.length < 6) return { error: 'Mot de passe trop court (6 caractères min).' }

  const motDePasseHash = await hash(motDePasse, 12)

  try {
    await db.insert(utilisateur).values({ nom, identifiant, motDePasseHash, role: role as 'commercial' | 'depot' | 'admin' })
    revalidatePath('/dashboard/utilisateurs')
    return { success: true }
  } catch {
    return { error: 'Identifiant déjà utilisé.' }
  }
}

export async function deleteUtilisateur(id: number): Promise<void> {
  const session = await getSession()
  if (session?.role !== 'admin') return
  if (session.id === id) return // ne pas se supprimer soi-même
  await db.delete(utilisateur).where(eq(utilisateur.id, id))
  revalidatePath('/dashboard/utilisateurs')
}
