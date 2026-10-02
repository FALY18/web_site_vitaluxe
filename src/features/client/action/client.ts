'use server'

import { db } from '@/db'
import { client } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import type { ClientFormState } from '../types'

export async function createClient(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const session = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const nom = (formData.get('nom') as string)?.trim()
  const telephone = (formData.get('telephone') as string)?.trim() || null
  const adresse = (formData.get('adresse') as string)?.trim() || null

  if (!nom) return { error: 'Le nom est requis.' }

  try {
    await db.insert(client).values({ nom, telephone, adresse })
    revalidatePath('/dashboard/clients')
    return { success: true }
  } catch {
    return { error: 'Ce client existe déjà.' }
  }
}

export async function updateClient(_prev: ClientFormState, formData: FormData): Promise<ClientFormState> {
  const session = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const id = Number(formData.get('id'))
  const nom = (formData.get('nom') as string)?.trim()
  const telephone = (formData.get('telephone') as string)?.trim() || null
  const adresse = (formData.get('adresse') as string)?.trim() || null

  if (!nom) return { error: 'Le nom est requis.' }

  await db.update(client).set({ nom, telephone, adresse }).where(eq(client.id, id))
  revalidatePath('/dashboard/clients')
  return { success: true }
}

export async function deleteClient(id: number): Promise<void> {
  const session = await getSession()
  if (!session || session.role === 'commercial') return
  try {
    await db.delete(client).where(eq(client.id, id))
    revalidatePath('/dashboard/clients')
  } catch { /* FK vente — ne pas supprimer si ventes liées */ }
}
