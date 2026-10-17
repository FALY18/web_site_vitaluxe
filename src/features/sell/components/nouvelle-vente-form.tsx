'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createVente } from '../action/vente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { VenteFormState, ClientRow } from '../types'

export function NouvelleVenteForm({ clients }: { clients: ClientRow[] }) {
  const router = useRouter()
  const [mode, setMode] = useState(clients.length ? 'existing' : 'new')
  const [search, setSearch] = useState('')
  const [state, action, pending] = useActionState(async (prev: VenteFormState, data: FormData) => {
    const result = await createVente(prev, data)
    if (result.success && result.venteId) router.push(`/ventes/${result.venteId}`)
    return result
  }, {} as VenteFormState)
  const filtered = clients.filter(c => `${c.nom} ${c.telephone ?? ''}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')))
  return (
    <form action={action} className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {['existing', 'new'].map(m => <Button key={m} type="button" variant={mode === m ? 'default' : 'outline'} aria-pressed={mode === m} onClick={() => setMode(m)}>{m === 'existing' ? 'Client existant' : 'Nouveau client'}</Button>)}
      </div>
      {mode === 'existing' ? <>
        <label htmlFor="client-search" className="text-xs text-muted-foreground">Rechercher par nom ou téléphone</label>
        <Input id="client-search" type="search" value={search} onChange={e => setSearch(e.target.value)} />
        <label htmlFor="client-id" className="text-xs text-muted-foreground">Client *</label>
        <select id="client-id" name="clientId" required className="h-11 min-w-0 w-full rounded-lg border border-input bg-card px-3 text-sm" defaultValue="">
          <option value="">Choisir un client</option>
          {filtered.map(c => <option key={c.id} value={c.id}>{c.nom}{c.telephone ? ` · ${c.telephone}` : ''}</option>)}
        </select>
        {!filtered.length && <p role="status" className="text-sm text-muted-foreground">Aucun client correspondant. Vous pouvez créer un nouveau client.</p>}
      </> : <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5"><label htmlFor="new-client-name" className="text-xs text-muted-foreground">Nom du client *</label><Input id="new-client-name" name="clientNom" required maxLength={150} /></div>
        <div className="grid gap-1.5"><label htmlFor="new-client-phone" className="text-xs text-muted-foreground">Téléphone</label><Input id="new-client-phone" name="clientTel" type="tel" maxLength={30} /></div>
      </div>}
      <div className="grid gap-1.5"><label htmlFor="sale-date" className="text-xs text-muted-foreground">Date *</label><Input id="sale-date" name="date" type="date" required defaultValue={new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Antananarivo' }).format(new Date())} /></div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>{pending ? 'Création…' : 'Continuer vers les articles'}</Button>
    </form>
  )
}
