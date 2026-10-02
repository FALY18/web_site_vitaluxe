'use client'

import { useActionState, useState } from 'react'
import { createVente } from '../action/vente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { VenteFormState } from '../types'
import type { ClientRow } from '@/features/client/types'
import { UserRound, Plus } from 'lucide-react'

type Props = {
  clients: ClientRow[]
  onSuccess: (venteId: number) => void
}

const initial: VenteFormState = {}

export function StepClient({ clients, onSuccess }: Props) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [search, setSearch] = useState('')

  const filtered = clients.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    (c.telephone ?? '').includes(search)
  )

  const [state, action, pending] = useActionState(async (prev: VenteFormState, fd: FormData) => {
    const res = await createVente(prev, fd)
    if (res.success && res.venteId) onSuccess(res.venteId)
    return res
  }, initial)

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="date" value={new Date().toISOString().slice(0, 10)} />

      {/* Toggle */}
      <div className="flex gap-2">
        {(['existing', 'new'] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-semibold border transition-all',
              mode === m
                ? 'bg-[#c8a96e]/15 text-[#c8a96e] border-[#c8a96e]/30'
                : 'text-muted-foreground border-white/10 hover:border-white/20'
            )}>
            {m === 'existing' ? 'Client existant' : 'Nouveau client'}
          </button>
        ))}
      </div>

      {mode === 'existing' ? (
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Rechercher par nom ou téléphone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-64 overflow-y-auto flex flex-col gap-1 rounded-lg border border-white/10 p-1">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun résultat</p>
            )}
            {filtered.map((c) => (
              <label key={c.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-white/5 transition-colors has-[:checked]:bg-[#c8a96e]/10 has-[:checked]:border has-[:checked]:border-[#c8a96e]/25">
                <input type="radio" name="clientId" value={c.id} className="accent-[#c8a96e]" required />
                <div className="size-7 rounded-full bg-[#c8a96e]/10 border border-[#c8a96e]/20 flex items-center justify-center shrink-0">
                  <UserRound className="size-3.5 text-[#c8a96e]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.nom}</p>
                  {c.telephone && <p className="text-xs text-muted-foreground">{c.telephone}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground">{c.nbVentes ?? 0} vente{(c.nbVentes ?? 0) > 1 ? 's' : ''}</span>
              </label>
            ))}
          </div>
          {/* hidden fields pour mode existing */}
          <input type="hidden" name="clientNom" value="" />
          <input type="hidden" name="clientTel" value="" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Nom *</label>
            <Input name="clientNom" required placeholder="Rakoto Jean" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Téléphone</label>
            <Input name="clientTel" placeholder="034 00 000 00" />
          </div>
          <input type="hidden" name="clientId" value="" />
        </div>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="self-end">
        {pending ? 'Création…' : 'Continuer →'}
      </Button>
    </form>
  )
}
