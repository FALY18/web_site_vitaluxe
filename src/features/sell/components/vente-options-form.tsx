'use client'

import { useActionState, useMemo, useState } from 'react'
import { updateVenteOptions } from '../action/vente'
import type { VenteDetail, VenteOptionsFormState } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateInvoiceTotals } from '@/features/invoice/models/invoice'

const initial: VenteOptionsFormState = {}

function formatAr(value: number) {
  return `${value.toLocaleString('fr-MG', { maximumFractionDigits: 2 })} Ar`
}

export function VenteOptionsForm({ vente, locked = false, onSaved, onDirty }: {
  vente: VenteDetail
  locked?: boolean
  onSaved?: () => void
  onDirty?: () => void
}) {
  const [mode, setMode] = useState<'pourcentage' | 'montant'>(vente.modeRemise)
  const [valeur, setValeur] = useState(vente.valeurRemise)
  const [livraison, setLivraison] = useState(vente.fraisLivraison)
  const base = Number(vente.total) || 0
  const preview = useMemo(() => {
    const totals = calculateInvoiceTotals(base, mode, Math.max(0, Number(valeur) || 0), Math.max(0, Number(livraison) || 0))
    return {
      remise: totals.montantRemise,
      net: totals.totalTtc,
    }
  }, [base, livraison, mode, valeur])

  const [state, action, pending] = useActionState(async (prev: VenteOptionsFormState, formData: FormData) => {
    const result = await updateVenteOptions(vente.id, prev, formData)
    if (result.success) {
      setValeur(String(formData.get('valeurRemise') ?? '0'))
      setLivraison(String(formData.get('fraisLivraison') ?? '0'))
      onSaved?.()
    }
    return result
  }, initial)

  return (
    <form action={action} onChange={onDirty} className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 sm:p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold">Étape 1 · Conditions de facturation</h3>
        <p className="mt-1 text-xs text-muted-foreground">Vérifiez la remise et les frais, puis continuez vers la facture. Aucune TVA n’est calculée.</p>
      </div>

      <fieldset disabled={pending || locked} className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`discount-mode-${vente.id}`} className="text-xs text-muted-foreground">Type de remise</label>
          <select
            id={`discount-mode-${vente.id}`}
            name="modeRemise"
            value={mode}
            disabled={locked}
            onChange={(event) => setMode(event.target.value as typeof mode)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="pourcentage" className="bg-card">Pourcentage</option>
            <option value="montant" className="bg-card">Montant fixe</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`discount-value-${vente.id}`} className="text-xs text-muted-foreground">
            {mode === 'pourcentage' ? 'Remise (%)' : 'Remise (Ar)'}
          </label>
          <Input
            id={`discount-value-${vente.id}`}
            name="valeurRemise"
            type="number"
            min="0"
            max={mode === 'pourcentage' ? '100' : base}
            step="0.01"
            value={valeur}
            disabled={locked}
            onChange={(event) => setValeur(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`delivery-fee-${vente.id}`} className="text-xs text-muted-foreground">Frais de livraison (Ar)</label>
          <Input
            id={`delivery-fee-${vente.id}`}
            name="fraisLivraison"
            type="number"
            min="0"
            step="0.01"
            value={livraison}
            disabled={locked}
            onChange={(event) => setLivraison(event.target.value)}
            required
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-foreground/3 px-3 py-2.5 text-xs">
        <span className="text-muted-foreground">Remise calculée : <strong className="text-foreground">{formatAr(preview.remise)}</strong></span>
        <span className="text-muted-foreground">Net à payer : <strong className="text-base text-primary">{formatAr(preview.net)}</strong></span>
      </div>

      {locked && <p className="text-xs text-amber-500">Facture émise : les montants sont verrouillés.</p>}
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-emerald-700">Options enregistrées.</p>}
      {!locked && <Button type="submit" size="sm" disabled={pending} className="self-end">
        {pending ? 'Enregistrement…' : onSaved ? 'Enregistrer et voir la facture →' : 'Enregistrer remise et livraison'}
      </Button>}
    </form>
  )
}
