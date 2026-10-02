import { db } from '@/db'
import { client, vente } from '@/db/schema'
import { eq, count } from 'drizzle-orm'
import type { ClientRow } from '../types'

export async function getClients(): Promise<ClientRow[]> {
  const rows = await db
    .select({
      id: client.id,
      nom: client.nom,
      telephone: client.telephone,
      adresse: client.adresse,
      nbVentes: count(vente.id),
    })
    .from(client)
    .leftJoin(vente, eq(client.id, vente.clientId))
    .groupBy(client.id)
    .orderBy(client.nom)
  return rows
}
