import { db } from '@/db'
import { vente, ligneVente, client, utilisateur, article, plateau, articleVitreDetail, categorie } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { VenteRow, VenteDetail, ClientRow, PlateauDisponible } from '../types'
import type { ArticleWithDetail, TypeArticle, UniteVente } from '@/features/article/types'

export async function getVentes(): Promise<VenteRow[]> {
  const rows = await db
    .select({
      id: vente.id,
      numero: vente.numero,
      date: vente.date,
      statut: vente.statut,
      total: vente.total,
      clientNom: client.nom,
      commercialNom: utilisateur.nom,
    })
    .from(vente)
    .innerJoin(client, eq(vente.clientId, client.id))
    .innerJoin(utilisateur, eq(vente.commercialId, utilisateur.id))
    .orderBy(desc(vente.numero))

  return rows as VenteRow[]
}

export async function getVenteById(id: number): Promise<VenteDetail | null> {
  const [v] = await db
    .select({
      id: vente.id,
      numero: vente.numero,
      date: vente.date,
      statut: vente.statut,
      total: vente.total,
      clientNom: client.nom,
      clientTelephone: client.telephone,
      commercialNom: utilisateur.nom,
    })
    .from(vente)
    .innerJoin(client, eq(vente.clientId, client.id))
    .innerJoin(utilisateur, eq(vente.commercialId, utilisateur.id))
    .where(eq(vente.id, id))

  if (!v) return null

    const lignes = await db
    .select({
      id: ligneVente.id,
      venteId: ligneVente.venteId,
      articleId: ligneVente.articleId,
      articleCode: article.code,
      articleDesignation: article.designation,
      plateauId: ligneVente.plateauId,
      mode: ligneVente.mode,
      nombre: ligneVente.nombre,
      longueurM: ligneVente.longueurM,
      hauteurM: ligneVente.hauteurM,
      quantiteFacturee: ligneVente.quantiteFacturee,
      prixApplique: ligneVente.prixApplique,
      montant: ligneVente.montant,
      surfaceRestanteApres: ligneVente.surfaceRestanteApres,
    })
    .from(ligneVente)
    .innerJoin(article, eq(ligneVente.articleId, article.id))
    .where(eq(ligneVente.venteId, id))

  return { ...v, lignes: lignes as VenteDetail['lignes'] } as VenteDetail
}

export async function getClients(): Promise<ClientRow[]> {
  return db.select({ id: client.id, nom: client.nom, telephone: client.telephone }).from(client).orderBy(client.nom)
}

export async function getPlateauxDisponibles(): Promise<PlateauDisponible[]> {
  const rows = await db
    .select({
      id: plateau.id,
      articleId: plateau.articleId,
      articleDesignation: article.designation,
      longueurOrigineM: plateau.longueurOrigineM,
      hauteurOrigineM: plateau.hauteurOrigineM,
      surfaceRestanteM2: plateau.surfaceRestanteM2,
      emplacement: plateau.emplacement,
    })
    .from(plateau)
    .innerJoin(article, eq(plateau.articleId, article.id))
    .where(eq(plateau.statut, 'disponible'))
    .orderBy(article.designation)

    return rows as PlateauDisponible[]
}

// ---------------------------------------------------------------------
// Article avec détail vitre (pour auto-calcul du prix à la vente)
// ---------------------------------------------------------------------
export async function getArticleForSale(
  id: number,
): Promise<ArticleWithDetail | null> {
  const [row] = await db
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
      // vitre detail
      epaisseurMm: articleVitreDetail.epaisseurMm,
      prixPlateauEntier: articleVitreDetail.prixPlateauEntier,
      prixPlateauGros: articleVitreDetail.prixPlateauGros,
    })
    .from(article)
    .leftJoin(
      articleVitreDetail,
      eq(articleVitreDetail.articleId, article.id),
    )
    .leftJoin(categorie, eq(article.categorieId, categorie.id))
    .where(eq(article.id, id))

  if (!row) return null

  // Ne construire le détail vitre que si l'épaisseur est présente
  const vitreDetail = row.epaisseurMm
    ? {
        epaisseurMm: row.epaisseurMm,
        prixPlateauEntier: row.prixPlateauEntier,
        prixPlateauGros: row.prixPlateauGros,
      }
    : null

  return {
    id: row.id,
    code: row.code,
    designation: row.designation,
    categorieId: row.categorieId,
    categorieNom: row.categorieNom,
    type: row.type as TypeArticle,
    couleur: row.couleur,
    uniteVente: row.uniteVente as UniteVente,
    prixVente: row.prixVente,
    vitreDetail,
    aluDetail: null,
  } as ArticleWithDetail
}

// ---------------------------------------------------------------------
// Plateau par id (pour décrémenter le stock)
// ---------------------------------------------------------------------
export async function getPlateauById(id: number): Promise<{
  id: number
  articleId: number
  longueurOrigineM: string
  hauteurOrigineM: string
  surfaceRestanteM2: string
  statut: 'disponible' | 'epuise' | 'vendu_entier'
} | null> {
  const [row] = await db
    .select({
      id: plateau.id,
      articleId: plateau.articleId,
      longueurOrigineM: plateau.longueurOrigineM,
      hauteurOrigineM: plateau.hauteurOrigineM,
      surfaceRestanteM2: plateau.surfaceRestanteM2,
      statut: plateau.statut,
    })
    .from(plateau)
    .where(eq(plateau.id, id))

  return row ?? null
}
