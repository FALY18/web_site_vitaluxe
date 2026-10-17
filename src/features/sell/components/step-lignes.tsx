'use client'

import { LigneForm } from './ligne-form'
import { Button } from '@/components/ui/button'
import { SaleActionForm } from './sale-action-form'
import { deleteLigne } from '../action/vente'
import { MODE_LABELS } from '../types'
import type { LigneVenteRow, PlateauDisponible } from '../types'
import type { ArticleWithDetail } from '@/features/article/types'

// Reuse the same validated entry module in the older step-based flow.
export function StepLignes({ venteId, articles, plateaux, lignes, onNext }: {
  venteId: number; articles: ArticleWithDetail[]; plateaux: PlateauDisponible[]
  lignes: LigneVenteRow[]; onNext: () => void
}) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4"><LigneForm venteId={venteId} articles={articles} plateaux={plateaux} /></div>
      <section className="grid min-w-0 gap-4">
        <h2 className="text-base font-semibold">Bon de vente · {lignes.length} ligne(s)</h2>
        <div className="max-h-[55dvh] divide-y divide-border overflow-auto rounded-xl border border-border bg-card">
          {lignes.map(line => <div key={line.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="min-w-0"><p className="break-words text-sm font-medium">{line.articleDesignation}</p><p className="text-xs text-muted-foreground">{MODE_LABELS[line.mode]} · {line.nombre} × · {Number(line.montant).toLocaleString('fr-FR')} Ar</p></div>
            <SaleActionForm action={deleteLigne.bind(null, line.id, venteId)}><Button type="submit" variant="ghost">Retirer</Button></SaleActionForm>
          </div>)}
          {lignes.length === 0 && <p className="p-4 text-sm text-muted-foreground">Ajoutez un premier article.</p>}
        </div>
        <Button onClick={onNext} disabled={lignes.length === 0}>Voir le résumé</Button>
      </section>
    </div>
  )
}
