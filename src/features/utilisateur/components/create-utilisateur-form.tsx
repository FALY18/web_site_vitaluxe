'use client'

import { useActionState } from 'react'
import { createUtilisateur } from '../action/utilisateur'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { UtilisateurFormState } from '../types'

const initial: UtilisateurFormState = {}

const roles = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'depot', label: 'Dépôt' },
  { value: 'admin', label: 'Administrateur' },
]

export function CreateUtilisateurForm({ onSuccess }: { onSuccess?: () => void }) {
  const [state, action, pending] = useActionState(async (prev: UtilisateurFormState, fd: FormData) => {
    const res = await createUtilisateur(prev, fd)
    if (res.success) onSuccess?.()
    return res
  }, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom complet</label>
          <Input name="nom" required placeholder="Jean Dupont" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Identifiant</label>
          <Input name="identifiant" required placeholder="jean.dupont" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mot de passe</label>
          <Input name="motDePasse" type="password" required placeholder="••••••••" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rôle</label>
          <select
            name="role"
            required
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value} className="bg-[#111]">{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} size="sm" className="self-end">
        {pending ? 'Création…' : 'Créer l\'utilisateur'}
      </Button>
    </form>
  )
}
