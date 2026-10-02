'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { createVente } from '../action/vente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { VenteFormState } from '../types'

const initial: VenteFormState = {}

export function NouvelleVenteForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(async (prev: VenteFormState, fd: FormData) => {
    const res = await createVente(prev, fd)
    if (res.success && res.venteId) router.push(`/dashboard/ventes/${res.venteId}`)
    return res
  }, initial)

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Nom du client *</label>
          <Input name="clientNom" required placeholder="ex: Rakoto Jean" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Téléphone client</label>
          <Input name="clientTel" placeholder="ex: 034 00 000 00" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Date</label>
          <Input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="sm" className="self-end">
        {pending ? 'Création…' : 'Créer la vente →'}
      </Button>
    </form>
  )
}
