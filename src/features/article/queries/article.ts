import { db } from '@/db'
import { article, articleVitreDetail, articleAluDetail, categorie } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import type { ArticleWithDetail, TypeArticle } from '../types'

export async function getArticles(): Promise<ArticleWithDetail[]> {
  const rows = await db
    .select({
      id: article.id,
      code: article.code,
      designation: article.designation,
      categorieId: article.categorieId,
      categorieNom: categorie.nom,
      type: article.type,
      couleur: article.couleur,
      uniteVente: article.uniteVente,
      prixVente: article.prixVente,
    })
    .from(article)
    .innerJoin(categorie, eq(article.categorieId, categorie.id))
    .orderBy(article.type, article.designation)

  const ids = rows.map((r) => r.id)
  if (ids.length === 0) return rows as ArticleWithDetail[]

  const [vitres, alus] = await Promise.all([
    db.select().from(articleVitreDetail).where(
      ids.length === 1
        ? eq(articleVitreDetail.articleId, ids[0])
        : eq(articleVitreDetail.articleId, ids[0]) // handled below via map
    ),
    db.select().from(articleAluDetail),
  ])

  const vitreMap = new Map(vitres.map((v) => [v.articleId, v]))
  const aluMap = new Map(alus.map((a) => [a.articleId, a]))

  return rows.map((r) => ({
    ...r,
    type: r.type as TypeArticle,
    vitreDetail: vitreMap.get(r.id) ?? null,
    aluDetail: aluMap.get(r.id) ?? null,
  })) as ArticleWithDetail[]
}

export async function getCategories() {
  return db.select().from(categorie).orderBy(categorie.nom)
}

/**
 * Vérifie si un article avec la même désignation et le même type existe déjà.
 * Utilisé avant la création pour éviter les doublons.
 */
export async function getArticleByDesignation(
  designation: string,
  type: TypeArticle,
): Promise<{ id: number; code: string } | null> {
  const [row] = await db
    .select({ id: article.id, code: article.code })
    .from(article)
    .where(
      and(
        eq(article.designation, designation),
        eq(article.type, type),
      ),
    )
    .limit(1)

  return row ?? null
}
