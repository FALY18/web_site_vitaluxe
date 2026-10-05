import { db } from '@/db'
import { article, articleVitreDetail, articleAluDetail, categorie } from '@/db/schema'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import type { ArticleWithDetail, TypeArticle } from '../types'

/**
 * Options de vérification de doublons selon le type d'article.
 * Chaque type a son propre critère de distinction :
 * - vitre : épaisseur (epaisseurMm)
 * - alu / accessoire : couleur (couleur)
 * - service : pas de critère supplémentaire (code déjà unique via la DB)
 */
interface DuplicateCheckOptions {
  epaisseurMm?: string
  couleur?: string | null
}

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
    db.select().from(articleVitreDetail).where(inArray(articleVitreDetail.articleId, ids)),
    db.select().from(articleAluDetail).where(inArray(articleAluDetail.articleId, ids)),
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
 * Vérifie si un article identique existe déjà avant la création.
 * La vérification tient compte des caractéristiques spécifiques à chaque type :
 * - vitre : même désignation + même épaisseur (epaisseurMm)
 * - alu / accessoire : même désignation + même couleur (couleur)
 * - service : même désignation + même type (le code est déjà unique via la DB)
 */
export async function getArticleByDesignation(
  designation: string,
  type: TypeArticle,
  options?: DuplicateCheckOptions,
): Promise<{ id: number; code: string } | null> {
  // --- vitre : join avec articleVitreDetail et filtre par epaisseurMm ---
  if (type === 'vitre' && options?.epaisseurMm) {
    const [row] = await db
      .select({ id: article.id, code: article.code })
      .from(article)
      .leftJoin(
        articleVitreDetail,
        eq(articleVitreDetail.articleId, article.id),
      )
      .where(
        and(
          eq(article.designation, designation),
          eq(article.type, type),
          eq(articleVitreDetail.epaisseurMm, options.epaisseurMm),
        )
      )
      .limit(1)
    return row ?? null
  }

  // --- alu : filter par couleur (colonne sur article) ---
  // Les profils alu peuvent avoir la même désignation mais des couleurs différentes
  // (ex: "Antelio Bleu" vs "Antelio Marron") → pas un doublon
  // L'emplacement est juste un métadonnée d'entreposage, pas un critère de distinction
  if (type === 'alu') {
    const [row] = await db
      .select({ id: article.id, code: article.code })
      .from(article)
      .where(
        and(
          eq(article.designation, designation),
          eq(article.type, type),
          options?.couleur
            ? eq(article.couleur, options.couleur)
            : isNull(article.couleur),
        )
      )
      .limit(1)
    return row ?? null
  }

  // --- accessoire : filter par couleur (colonne sur article) ---
  if (type === 'accessoire') {
    const [row] = await db
      .select({ id: article.id, code: article.code })
      .from(article)
      .where(
        and(
          eq(article.designation, designation),
          eq(article.type, type),
          options?.couleur
            ? eq(article.couleur, options.couleur)
            : isNull(article.couleur),
        )
      )
      .limit(1)
    return row ?? null
  }

  // --- service : désignation + type seulement (code déjà unique en DB) ---
  const [row] = await db
    .select({ id: article.id, code: article.code })
    .from(article)
    .where(
      and(
        eq(article.designation, designation),
        eq(article.type, type),
      )
    )
    .limit(1)

  return row ?? null
}
