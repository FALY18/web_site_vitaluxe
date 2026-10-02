import { db } from '@/db'
import { vente, ligneVente, client, utilisateur, article, plateau } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { VenteRow, VenteDetail, ClientRow, PlateauDisponible } from '../types'

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
