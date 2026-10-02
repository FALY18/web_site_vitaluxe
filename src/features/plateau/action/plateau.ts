'use server'

import { db } from '@/db'
import { plateau } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import type { PlateauFormState, StatutPlateau } from '../types'

export async function createPlateau(_prev: PlateauFormState, formData: FormData): Promise<PlateauFormState> {
  const session = await getSession()
  if (!session || session.role === 'commercial') return { error: 'Accès refusé.' }

  const articleId = Number(formData.get('articleId'))
  const longueurOrigineM = formData.get('longueurOrigineM') as string
  const hauteurOrigineM = formData.get('hauteurOrigineM') as string
  const emplacement = (formData.get('emplacement') as string)?.trim() || null

  if (!articleId || !longueurOrigineM || !hauteurOrigineM) return { error: 'Champs obligatoires manquants.' }

  const surface = (Number(longueurOrigineM) * Number(hauteurOrigineM)).toFixed(2)

  try {
    await db.insert(plateau).values({
      articleId,
      longueurOrigineM,
      hauteurOrigineM,
      surfaceRestanteM2: surface,
      emplacement,
      statut: 'disponible',
    })
    revalidatePath('/dashboard/plateaux')
    return { success: true }
  } catch {
    return { error: 'Erreur lors de la création.' }
  }
}

export async function updatePlateauEmplacement(id: number, emplacement: string): Promise<void> {
  const session = await getSession()
  if (!session || session.role === 'commercial') return
  await db.update(plateau).set({ emplacement: emplacement || null }).where(eq(plateau.id, id))
  revalidatePath('/dashboard/plateaux')
}

export async function updateStatutPlateau(id: number, statut: StatutPlateau): Promise<void> {
  const session = await getSession()
  if (!session || session.role === 'commercial') return
  await db.update(plateau).set({ statut }).where(eq(plateau.id, id))
  revalidatePath('/dashboard/plateaux')
}

export async function deletePlateau(id: number): Promise<void> {
  const session = await getSession()
  if (!session || session.role === 'commercial') return
  try {
    await db.delete(plateau).where(eq(plateau.id, id))
    revalidatePath('/dashboard/plateaux')
  } catch { /* FK ligne_vente */ }
}
