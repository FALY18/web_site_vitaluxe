'use client'

import { useActionState, useState } from 'react'
import { createClient, updateClient } from '../action/client'
import { deleteClient } from '../action/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, X, Check, Plus } from 'lucide-react'
import type { ClientRow, ClientFormState } from '../types'
import { cn } from '@/lib/utils'

const initial: ClientFormState = {}

function CreateForm() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(async (prev: ClientFormState, fd: FormData) => {
    const res = await createClient(prev, fd)
    if (res.success) setOpen(false)
    return res
  }, initial)

  if (!open) return (
    <Button size="sm" onClick={() => setOpen(true)}>
      <Plus className="size-4" />Nouveau client
    </Button>
  )

  return (
    <form action={action} className="flex items-end gap-2 p-3 rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-muted-foreground">Nom *</label>
        <Input name="nom" required placeholder="Rakoto Jean" autoFocus />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-muted-foreground">Téléphone</label>
        <Input name="telephone" placeholder="034 00 000 00" />
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-muted-foreground">Adresse</label>
        <Input name="adresse" placeholder="Antananarivo" />
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" type="submit" disabled={pending}><Check className="size-4" /></Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}><X className="size-4" /></Button>
      </div>
      {state.error && <p className="text-xs text-destructive col-span-full">{state.error}</p>}
    </form>
  )
}

function EditRow({ client, onDone }: { client: ClientRow; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (prev: ClientFormState, fd: FormData) => {
    const res = await updateClient(prev, fd)
    if (res.success) onDone()
    return res
  }, initial)

  return (
    <tr className="border-b border-white/5 bg-white/3">
      <td colSpan={5} className="px-4 py-3">
        <form action={action} className="flex items-end gap-2">
          <input type="hidden" name="id" value={client.id} />
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-muted-foreground">Nom *</label>
            <Input name="nom" defaultValue={client.nom} required autoFocus />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-muted-foreground">Téléphone</label>
            <Input name="telephone" defaultValue={client.telephone ?? ''} />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-muted-foreground">Adresse</label>
            <Input name="adresse" defaultValue={client.adresse ?? ''} />
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" type="submit" disabled={pending}><Check className="size-4" /></Button>
            <Button size="sm" variant="ghost" type="button" onClick={onDone}><X className="size-4" /></Button>
          </div>
          {state.error && <p className="text-xs text-destructive">{state.error}</p>}
        </form>
      </td>
    </tr>
  )
}

export function ClientManager({ clients }: { clients: ClientRow[] }) {
  const [editId, setEditId] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-4">
      <CreateForm />

      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {['Nom', 'Téléphone', 'Adresse', 'Ventes', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun client.</td></tr>
            )}
            {clients.map((c) => editId === c.id ? (
              <EditRow key={c.id} client={c} onDone={() => setEditId(null)} />
            ) : (
              <tr key={c.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3 font-medium">{c.nom}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{c.telephone ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{c.adresse ?? '—'}</td>
                <td className="px-4 py-3 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground">{c.nbVentes ?? 0}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditId(c.id)} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="size-3.5" />
                    </Button>
                    {(c.nbVentes ?? 0) === 0 && (
                      <form action={deleteClient.bind(null, c.id)}>
                        <Button variant="ghost" size="icon-sm" type="submit" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
