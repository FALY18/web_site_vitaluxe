'use server'

import { db } from '@/db'
import { article, articleVitreDetail, articleAluDetail } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import { getArticleByDesignation } from '../queries/article'
import type { ArticleFormState, TypeArticle } from '../types'

export async function createArticle(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  const session = await getSession()
  if (!session || session.role === 'commercial') return { error: 'Accès refusé.' }

  const designation = (formData.get('designation') as string)?.trim()
  const categorieId = Number(formData.get('categorieId'))
  const type = formData.get('type') as TypeArticle
  const couleur = (formData.get('couleur') as string)?.trim() || null
  const uniteVente = formData.get('uniteVente') as string
  const prixVente = formData.get('prixVente') as string

  if (!designation || !categorieId || !type || !uniteVente || !prixVente) {
    return { error: 'Tous les champs obligatoires sont requis.' }
  }

  // Pour "service" : code obligatoire manuellement (trigger refuse si vide)
  const codeManuel = (formData.get('code') as string)?.trim()
  if (type === 'service' && !codeManuel) {
    return { error: 'Le code article est obligatoire pour un service.' }
  }

  // Pour vitre/alu/accessoire : on passe '' → le trigger génère le code
  const codeInsert = type === 'service' ? codeManuel : ''

  // Vérification des doublons : même désignation + même type
  const existing = await getArticleByDesignation(designation, type)
  if (existing) {
    return {
      error: `Un article "${designation}" de type "${type}" existe déjà (code: ${existing.code}).`,
    }
  }

  try {
    const [created] = await db
      .insert(article)
      .values({
        code: codeInsert,
        designation,
        categorieId,
        type,
        couleur,
        uniteVente: uniteVente as 'm2' | 'barre' | 'unite' | 'forfait' | 'heure',
        prixVente,
      })
      .returning({ id: article.id })

    if (type === 'vitre') {
      const epaisseurMm = formData.get('epaisseurMm') as string
      const prixPlateauEntier = formData.get('prixPlateauEntier') as string
      const prixPlateauGros = (formData.get('prixPlateauGros') as string) || null
      if (!epaisseurMm || !prixPlateauEntier) return { error: 'Détails vitre requis.' }
      await db.insert(articleVitreDetail).values({
        articleId: created.id,
        epaisseurMm,
        prixPlateauEntier,
        prixPlateauGros,
      })
    }

    if (type === 'alu') {
      const prixPack = formData.get('prixPack') as string
      const nombreParPack = Number(formData.get('nombreParPack'))
      const emplacement = (formData.get('emplacement') as string)?.trim() || null
      if (!prixPack || !nombreParPack) return { error: 'Détails aluminium requis.' }
      await db.insert(articleAluDetail).values({
        articleId: created.id,
        prixPack,
        nombreParPack,
        emplacement,
      })
    }

    revalidatePath('/dashboard/articles')
    return { success: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('manuellement')) return { error: msg }
    if (msg.includes('unique') || msg.includes('duplicate')) return { error: 'Code article déjà utilisé.' }
    return { error: 'Erreur lors de la création.' }
  }
}

export async function deleteArticle(id: number): Promise<void> {
  const session = await getSession()
  if (!session || session.role === 'commercial') return
  await db.delete(article).where(eq(article.id, id))
  revalidatePath('/dashboard/articles')
}
