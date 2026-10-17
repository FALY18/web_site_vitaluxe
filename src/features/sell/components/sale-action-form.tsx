'use client'

import { useActionState } from 'react'
import type { LigneFormState } from '../types'

export function SaleActionForm({ action, children, confirmMessage }: {
  action: () => Promise<LigneFormState>
  children: React.ReactNode
  confirmMessage?: string
}) {
  const [state, submit, pending] = useActionState(async () => {
    try { return await action() }
    catch { return { error: 'Opération impossible. Réessayez après avoir actualisé la vente.' } }
  }, {} as LigneFormState)
  return (
    <form action={submit} onSubmit={event => {
      if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault()
    }}>
      <fieldset disabled={pending} className="min-w-0 disabled:opacity-50">{children}</fieldset>
      {pending && <span role="status" className="text-xs text-muted-foreground">En cours…</span>}
      {state.error && <p role="alert" className="mt-2 max-w-xs whitespace-normal text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
