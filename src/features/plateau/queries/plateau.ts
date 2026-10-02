import { db } from '@/db'
import { plateau, article } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { PlateauRow } from '../types'

export async function getPlateaux(): Promise<PlateauRow[]> {
  const rows = await db
    .select({
      id: plateau.id,
      articleId: plateau.articleId,
      articleCode: article.code,
      articleDesignation: article.designation,
      longueurOrigineM: plateau.longueurOrigineM,
      hauteurOrigineM: plateau.hauteurOrigineM,
      surfaceRestanteM2: plateau.surfaceRestanteM2,
      emplacement: plateau.emplacement,
      statut: plateau.statut,
    })
    .from(plateau)
    .innerJoin(article, eq(plateau.articleId, article.id))
    .orderBy(plateau.statut, article.designation)

  return rows as PlateauRow[]
}

export async function getArticlesVitre() {
  return db
    .select({ id: article.id, code: article.code, designation: article.designation })
    .from(article)
    .where(eq(article.type, 'vitre'))
    .orderBy(article.designation)
}
