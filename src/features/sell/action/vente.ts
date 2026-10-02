'use server'

import { db } from '@/db'
import { vente, ligneVente, client } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/features/auth/session'
import type { VenteFormState, LigneFormState, ModeLigne } from '../types'

// ── Créer ou trouver un client à la volée ──────────────────────────────
async function upsertClient(nom: string, telephone: string | null): Promise<number> {
  const existing = await db.select({ id: client.id }).from(client)
    .where(eq(client.nom, nom)).limit(1)
  if (existing.length > 0) return existing[0].id
  const [c] = await db.insert(client).values({ nom, telephone }).returning({ id: client.id })
  return c.id
}

// ── Créer une vente (brouillon) ────────────────────────────────────────
export async function createVente(
  _prev: VenteFormState,
  formData: FormData
): Promise<VenteFormState> {
  const session = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const clientNom = (formData.get('clientNom') as string)?.trim()
  const clientTel = (formData.get('clientTel') as string)?.trim() || null
  const date = (formData.get('date') as string) || new Date().toISOString().slice(0, 10)

  if (!clientNom) return { error: 'Le nom du client est requis.' }

  const clientId = await upsertClient(clientNom, clientTel)

  const [v] = await db
    .insert(vente)
    .values({ numero: 0, clientId, commercialId: session.id, date, statut: 'brouillon', total: '0' })
    .returning({ id: vente.id })

  revalidatePath('/dashboard/ventes')
  return { success: true, venteId: v.id }
}

// ── Ajouter une ligne ──────────────────────────────────────────────────
export async function addLigne(
  _prev: LigneFormState,
  formData: FormData
): Promise<LigneFormState> {
  const session = await getSession()
  if (!session) return { error: 'Non authentifié.' }

  const venteId = Number(formData.get('venteId'))
  const articleId = Number(formData.get('articleId'))
  const mode = formData.get('mode') as ModeLigne
  const nombre = Number(formData.get('nombre'))
  const prixApplique = formData.get('prixApplique') as string
  const plateauId = formData.get('plateauId') ? Number(formData.get('plateauId')) : null
  const longueurM = formData.get('longueurM') ? (formData.get('longueurM') as string) : null
  const hauteurM = formData.get('hauteurM') ? (formData.get('hauteurM') as string) : null

  if (!venteId || !articleId || !mode || !nombre || !prixApplique) {
    return { error: 'Champs obligatoires manquants.' }
  }

  // Calcul quantité facturée et montant selon mode
  let quantiteFacturee: string
  let montant: string

  if (mode === 'decoupe' && longueurM && hauteurM) {
    const surface = (Number(longueurM) * Number(hauteurM) * nombre).toFixed(2)
    quantiteFacturee = surface
    montant = (Number(surface) * Number(prixApplique)).toFixed(2)
  } else {
    quantiteFacturee = nombre.toString()
    montant = (nombre * Number(prixApplique)).toFixed(2)
  }

  await db.insert(ligneVente).values({
    venteId, articleId, plateauId, mode, nombre,
    longueurM, hauteurM, quantiteFacturee, prixApplique, montant,
  })

  // Recalcul total vente
  await db.execute(sql`
    UPDATE vente SET total = (
      SELECT COALESCE(SUM(montant), 0) FROM ligne_vente WHERE vente_id = ${venteId}
    ) WHERE id = ${venteId}
  `)

  revalidatePath(`/dashboard/ventes/${venteId}`)
  return { success: true }
}

// ── Supprimer une ligne ────────────────────────────────────────────────
export async function deleteLigne(ligneId: number, venteId: number): Promise<void> {
  const session = await getSession()
  if (!session) return
  await db.delete(ligneVente).where(eq(ligneVente.id, ligneId))
  await db.execute(sql`
    UPDATE vente SET total = (
      SELECT COALESCE(SUM(montant), 0) FROM ligne_vente WHERE vente_id = ${venteId}
    ) WHERE id = ${venteId}
  `)
  revalidatePath(`/dashboard/ventes/${venteId}`)
}

// ── Changer le statut ──────────────────────────────────────────────────
export async function updateStatutVente(id: number, statut: 'confirmee' | 'livree' | 'annulee'): Promise<void> {
  const session = await getSession()
  if (!session) return
  await db.update(vente).set({ statut }).where(eq(vente.id, id))
  revalidatePath(`/dashboard/ventes/${id}`)
  revalidatePath('/dashboard/ventes')
}

// ── Supprimer une vente (brouillon seulement) ──────────────────────────
export async function deleteVente(id: number): Promise<void> {
  const session = await getSession()
  if (!session) return
  await db.delete(vente).where(eq(vente.id, id))
  revalidatePath('/dashboard/ventes')
}
