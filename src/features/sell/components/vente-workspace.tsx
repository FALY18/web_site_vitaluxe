'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function VenteWorkspace({ entry, detail, invoice, count }: {
  entry?: React.ReactNode
  detail: React.ReactNode
  invoice?: React.ReactNode
  count: number
}) {
  const [tab, setTab] = useState(entry ? 'entry' : 'detail')
  const tabs = [
    ...(entry ? [{ id: 'entry', label: 'Saisie des articles', mobile: false }] : []),
    { id: 'detail', label: `Bon de vente (${count})`, mobile: Boolean(entry) },
    ...(invoice ? [{ id: 'invoice', label: 'Facturation', mobile: false }] : []),
  ]
  return (
    <div>
      <nav aria-label="Sections de la vente" className="mb-4 flex gap-2 overflow-x-auto border-b border-border pb-3 print:hidden">
        {tabs.map(t => <button key={t.id} type="button" aria-controls={`sale-panel-${t.id}`} aria-pressed={tab === t.id} onClick={() => setTab(t.id)} className={cn('min-h-11 shrink-0 rounded-lg px-4 text-sm font-medium', t.mobile && 'xl:hidden', tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted')}>{t.label}</button>)}
      </nav>
      <div className={cn('gap-5', entry && tab !== 'invoice' && 'xl:grid xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]')}>
        {entry && <section id="sale-panel-entry" aria-label="Saisie des articles" className={cn('min-w-0 print:hidden', tab === 'entry' ? 'block' : 'hidden', tab !== 'invoice' && 'xl:block')}>
          <div className="rounded-xl border border-border bg-card p-4 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-3rem)] xl:overflow-y-auto">
            <h2 className="mb-4 text-base font-semibold">Ajouter un article</h2>
            {entry}
          </div>
        </section>}
        <section id="sale-panel-detail" aria-label="Bon de vente" className={cn('min-w-0 print:hidden', tab === 'detail' || (!entry && tab !== 'invoice') ? 'block' : 'hidden', entry && tab !== 'invoice' && 'xl:block')}>{detail}</section>
        {invoice && <section id="sale-panel-invoice" aria-label="Facturation" className={cn('min-w-0 print:block', tab === 'invoice' ? 'block' : 'hidden')}>{invoice}</section>}
      </div>
    </div>
  )
}
