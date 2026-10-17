'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VenteDetail } from '../types'
import { VenteOptionsForm } from './vente-options-form'
import type { PaymentSummary } from '@/features/invoice/types'

export function InvoiceSteps({ vente, locked, children, reglements, paymentToken }: {
  vente: VenteDetail
  locked: boolean
  children: React.ReactNode
  reglements: PaymentSummary
  paymentToken: string
}) {
  const [step, setStep] = useState<1 | 2>(locked ? 2 : 1)
  const [saved, setSaved] = useState(locked)
  const heading = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(step)

  useEffect(() => {
    if (previousStep.current !== step) {
      heading.current?.focus({ preventScroll: true })
      heading.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
      previousStep.current = step
    }
  }, [step])

  return (
    <div className="grid gap-4">
      <nav aria-label="Étapes de facturation" className="print:hidden">
        <ol className="grid grid-cols-2 gap-2">
          {([1, 2] as const).map(value => <li key={value}>
            <button type="button" aria-current={step === value ? 'step' : undefined} aria-controls={`invoice-step-${value}`} disabled={value === 2 && !saved && !locked} onClick={() => setStep(value)} className={cn('flex min-h-12 w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', step === value ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted')}>
              <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full border border-current text-xs">{value}</span>
              {value === 1 ? 'Conditions et règlements' : 'Facture'}
            </button>
          </li>)}
        </ol>
      </nav>
      <h2 ref={heading} tabIndex={-1} className="text-base font-semibold outline-none print:hidden">
        {step === 1 ? 'Remise, livraison et règlements reçus' : 'Votre facture'}
      </h2>
      <section id="invoice-step-1" aria-label="Conditions et paiement" className={cn('print:hidden', step !== 1 && 'hidden')}>
        <VenteOptionsForm vente={vente} locked={locked} reglements={reglements} paymentToken={paymentToken} onDirty={() => setSaved(false)} onSaved={() => { setSaved(true); setStep(2) }} />
        {locked && <Button type="button" className="mt-4" onClick={() => setStep(2)}>Voir la facture →</Button>}
      </section>
      <section id="invoice-step-2" aria-label="Facture" className={cn('grid gap-4 print:block', step !== 2 && 'hidden')}>
        <div className="print:hidden"><Button type="button" variant="outline" onClick={() => setStep(1)}>← {locked ? 'Conditions et règlements' : 'Modifier les conditions'}</Button></div>
        {children}
      </section>
    </div>
  )
}
