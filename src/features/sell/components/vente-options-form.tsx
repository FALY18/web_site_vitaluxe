'use client'

import { useActionState, useMemo, useState } from 'react'
import { updateVenteOptions } from '../action/vente'
import type { VenteDetail, VenteOptionsFormState } from '../types'
import { PAIEMENT_LABELS } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { calculateInvoiceTotals } from '@/features/invoice/models/invoice'
import type { PaymentSummary } from '@/features/invoice/types'

const initial: VenteOptionsFormState = {}

function formatAr(value: number) {
  return `${value.toLocaleString('fr-MG', { maximumFractionDigits: 2 })} Ar`
}

export function VenteOptionsForm({ vente, locked = false, onSaved, onDirty, reglements, paymentToken }: {
  vente: VenteDetail
  locked?: boolean
  onSaved?: () => void
  onDirty?: () => void
  reglements: PaymentSummary
  paymentToken: string
}) {
  const [mode, setMode] = useState<'pourcentage' | 'montant'>(vente.modeRemise)
  const [valeur, setValeur] = useState(vente.valeurRemise)
  const [livraison, setLivraison] = useState(vente.fraisLivraison)
  const [paiement, setPaiement] = useState('')
  const [encaisser, setEncaisser] = useState(false)
  const [montant, setMontant] = useState('')
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Antananarivo' }).format(new Date())
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
      setEncaisser(false)
      setMontant('')
      onSaved?.()
    }
    return result
  }, initial)

  return (
    <form action={action} onChange={onDirty} className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 sm:p-5 flex flex-col gap-4">
      <input type="hidden" name="paymentToken" value={paymentToken} />
      {locked && <>
        <input type="hidden" name="modeRemise" value={vente.modeRemise} />
        <input type="hidden" name="valeurRemise" value={vente.valeurRemise} />
        <input type="hidden" name="fraisLivraison" value={vente.fraisLivraison} />
      </>}
      <div>
        <h3 className="text-sm font-semibold">Étape 1 · Conditions de facturation</h3>
        <p className="mt-1 text-xs text-muted-foreground">Vérifiez les conditions et enregistrez uniquement les montants réellement reçus. Aucune TVA n’est calculée.</p>
      </div>

      <fieldset disabled={pending || locked} className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
      <fieldset disabled={pending} className="grid min-w-0 gap-3 rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-medium">Règlements reçus</legend>
        <p className="text-xs text-muted-foreground">Déjà reçu : <strong>{formatAr(reglements.montantPaye)}</strong> · Solde : <strong>{formatAr(locked ? reglements.resteAPayer : preview.net)}</strong></p>
        {(!locked || reglements.resteAPayer > 0) && <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm">
          <input name="encaisser" type="checkbox" checked={encaisser} onChange={event => setEncaisser(event.target.checked)} className="size-4 accent-primary" />
          Enregistrer un règlement reçu
        </label>}
        {encaisser && <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-1.5"><label htmlFor={`received-${vente.id}`} className="text-xs text-muted-foreground">Montant reçu (Ar) *</label><Input id={`received-${vente.id}`} name="montantRecu" type="number" min="0.01" max={locked ? reglements.resteAPayer : preview.net} step="0.01" value={montant} onChange={event => setMontant(event.target.value)} required /></div>
          <div className="grid gap-1.5"><label htmlFor={`payment-mode-${vente.id}`} className="text-xs text-muted-foreground">Mode de paiement *</label><select id={`payment-mode-${vente.id}`} name="modePaiement" value={paiement} onChange={event => setPaiement(event.target.value)} required className="h-8 w-full min-w-0 rounded-lg border border-input bg-card px-2.5 text-sm"><option value="">Choisir un mode</option>{Object.entries(PAIEMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="grid gap-1.5"><label htmlFor={`payment-date-${vente.id}`} className="text-xs text-muted-foreground">Date de réception *</label><Input id={`payment-date-${vente.id}`} name="datePaiement" type="date" defaultValue={today} max={today} required /></div>
        </div>}
        {encaisser && !locked && <p className="text-xs text-muted-foreground">L’enregistrement du règlement émet la facture et verrouille ses conditions.</p>}
        {reglements.paiements.length > 0 && <details><summary className="cursor-pointer text-xs font-medium">Historique · {reglements.paiements.length} règlement(s)</summary><ul className="mt-2 max-h-32 overflow-auto text-xs">{reglements.paiements.map(receipt => <li key={receipt.id} className="flex flex-wrap justify-between gap-2 border-t border-border py-2"><span>{new Date(`${receipt.date}T12:00:00`).toLocaleDateString('fr-FR')} · {PAIEMENT_LABELS[receipt.mode]}</span><strong>{formatAr(Number(receipt.montant))}</strong></li>)}</ul></details>}
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-foreground/3 px-3 py-2.5 text-xs">
        <span className="text-muted-foreground">Remise calculée : <strong className="text-foreground">{formatAr(preview.remise)}</strong></span>
        <span className="text-muted-foreground">Net à payer : <strong className="text-base text-primary">{formatAr(preview.net)}</strong></span>
      </div>

      {locked && <p className="text-xs text-muted-foreground">Les conditions sont verrouillées. Vous pouvez enregistrer un règlement complémentaire tant qu’un solde reste dû.</p>}
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p role="status" className="text-sm text-emerald-700">Options enregistrées.</p>}
      {(!locked || reglements.resteAPayer > 0) && <Button type="submit" size="sm" disabled={pending || (locked && !encaisser)} className="self-end">
        {pending ? 'Enregistrement…' : encaisser ? 'Enregistrer le règlement et voir la facture →' : 'Enregistrer et voir la facture →'}
      </Button>}
    </form>
  )
}
