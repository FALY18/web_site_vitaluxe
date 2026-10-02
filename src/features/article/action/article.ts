'use server'

import { db } from '@/db'
import { article, articleVitreDetail, articleAluDetail } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import type { ArticleFormState } from '../types'

export async function createArticle(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const session = await getSession()
  if (!session || session.role === 'commercial') return { error: 'Accès refusé.' }

  const code = (formData.get('code') as string)?.trim()
  const designation = (formData.get('designation') as string)?.trim()
  const categorieId = Number(formData.get('categorieId'))
  const type = formData.get('type') as string
  const couleur = (formData.get('couleur') as string)?.trim() || null
  const uniteVente = formData.get('uniteVente') as string
  const prixVente = formData.get('prixVente') as string

  if (!code || !designation || !categorieId || !type || !uniteVente || !prixVente) {
    return { error: 'Tous les champs obligatoires sont requis.' }
  }

  try {
    const [created] = await db
      .insert(article)
      .values({ code, designation, categorieId, type: type as 'vitre' | 'alu' | 'accessoire' | 'service', couleur, uniteVente: uniteVente as 'm2' | 'barre' | 'unite' | 'forfait' | 'heure', prixVente })
      .returning({ id: article.id })

    if (type === 'vitre') {
      const epaisseurMm = formData.get('epaisseurMm') as string
      const prixPlateauEntier = formData.get('prixPlateauEntier') as string
      const prixPlateauGros = (formData.get('prixPlateauGros') as string) || null
      if (!epaisseurMm || !prixPlateauEntier) return { error: 'Détails vitre requis.' }
      await db.insert(articleVitreDetail).values({ articleId: created.id, epaisseurMm, prixPlateauEntier, prixPlateauGros })
    }

    if (type === 'alu') {
      const prixPack = formData.get('prixPack') as string
      const nombreParPack = Number(formData.get('nombreParPack'))
      const emplacement = (formData.get('emplacement') as string)?.trim() || null
      if (!prixPack || !nombreParPack) return { error: 'Détails aluminium requis.' }
      await db.insert(articleAluDetail).values({ articleId: created.id, prixPack, nombreParPack, emplacement })
    }

    revalidatePath('/dashboard/articles')
    return { success: true }
  } catch {
    return { error: 'Code article déjà utilisé.' }
  }
}

export async function deleteArticle(id: number): Promise<void> {
  const session = await getSession()
  if (!session || session.role === 'commercial') return
  await db.delete(article).where(eq(article.id, id))
  revalidatePath('/dashboard/articles')
}
