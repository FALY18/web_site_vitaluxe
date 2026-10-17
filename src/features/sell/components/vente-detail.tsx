import { SaleActionForm } from './sale-action-form'
import { deleteLigne, updateStatutVente } from '../action/vente'
import { StatutBadge } from './vente-statut-badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { MODE_LABELS } from '../types'
import type { VenteDetail } from '../types'
import { calculateInvoiceTotals } from '@/features/invoice/models/invoice'

function formatAr(val: string) {
  return Number(val).toLocaleString('fr-MG') + ' Ar'
}

export function VenteDetailView({ vente }: { vente: VenteDetail }) {
  const isBrouillon = vente.statut === 'brouillon'
  const sheetBalances = Array.from(new Map(vente.lignes.flatMap(line => line.plateauId != null && line.surfaceRestanteActuelleM2 != null
    ? [[line.plateauId, { id: line.plateauId, article: line.articleDesignation, remaining: line.surfaceRestanteActuelleM2 }] as const] : [])).values())
  const totals = calculateInvoiceTotals(
    vente.total,
    vente.modeRemise,
    vente.valeurRemise,
    vente.fraisLivraison,
  )

  return (
    <div className="flex flex-col gap-4">
      {/* En-tête */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-heading font-bold text-primary">#{vente.numero}</span>
            <StatutBadge statut={vente.statut} />
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(vente.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-sm mt-1">
            <span className="text-muted-foreground">Client : </span>
            <span className="font-medium">{vente.clientNom}</span>
            {vente.clientTelephone && <span className="text-muted-foreground ml-2">· {vente.clientTelephone}</span>}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Commercial : </span>
            <span className="font-medium">{vente.commercialNom}</span>
          </p>
        </div>
        <div className="min-w-0 break-words sm:text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{vente.statut === 'annulee' ? 'Montant annulé' : 'Net à payer'}</p>
          <p className="text-xl font-heading font-bold">{formatAr(totals.totalTtc.toFixed(2))}</p>
          {(Number(vente.valeurRemise) > 0 || Number(vente.fraisLivraison) > 0) && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Articles {formatAr(vente.total)} · remise −{formatAr(totals.montantRemise.toFixed(2))} · livraison {formatAr(totals.fraisLivraison.toFixed(2))}
            </p>
          )}
        </div>
      </div>

      {/* Actions statut */}
      {isBrouillon && (
        <div className="flex flex-wrap gap-2">
          <SaleActionForm action={updateStatutVente.bind(null, vente.id, 'confirmee')}>
            <Button size="sm" type="submit" disabled={vente.lignes.length === 0}>Confirmer la vente</Button>
          </SaleActionForm>
          <SaleActionForm action={updateStatutVente.bind(null, vente.id, 'annulee')} confirmMessage="Annuler cette vente et restituer son stock ?">
            <Button size="sm" variant="destructive" type="submit">Annuler</Button>
          </SaleActionForm>
        </div>
      )}
      {vente.statut === 'confirmee' && (
        <SaleActionForm action={updateStatutVente.bind(null, vente.id, 'livree')}>
          <Button size="sm" type="submit">Marquer comme livrée</Button>
        </SaleActionForm>
      )}

      {/* Lignes */}
      {sheetBalances.length > 0 && <details className="rounded-xl border border-border bg-card p-3">
        <summary className="cursor-pointer text-sm font-medium">Reste actuel des plateaux · {sheetBalances.length} plateau(x) · {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(sheetBalances.reduce((sum, sheet) => sum + Number(sheet.remaining), 0))} m²</summary>
        <p className="mt-2 text-xs text-muted-foreground">Stock actuel enregistré dans les plateaux, incluant les autres ventes et annulations.</p>
        <dl className="mt-3 max-h-48 divide-y divide-border overflow-y-auto">
          {sheetBalances.map(sheet => <div key={sheet.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><dt>#{sheet.id} · {sheet.article}</dt><dd className="font-semibold text-primary">{sheet.remaining} m²</dd></div>)}
        </dl>
      </details>}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 max-h-[55dvh] overflow-auto">
        <div className="px-4 py-3 border-b border-foreground/8 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Lignes ({vente.lignes.length})
          </p>
        </div>
        {vente.lignes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune ligne. Utilisez la saisie des articles pour préparer le bon.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-foreground/5">
                {['Article', 'Mode', 'Qté', 'Dimensions', 'Prix unit.', 'Montant', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vente.lignes.map((l) => (
                <tr key={l.id} className="border-b border-foreground/5 last:border-0 hover:bg-foreground/3 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{l.articleDesignation}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{l.articleCode}</p>
                    {l.plateauId != null && <p className="mt-1 text-[10px] text-muted-foreground">Plateau #{l.plateauId} · reste après cette ligne : {l.surfaceRestanteApres ?? '—'} m²</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{MODE_LABELS[l.mode]}</td>
                  <td className="px-4 py-3 text-xs">{l.nombre}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {l.longueurM && l.hauteurM ? `${l.longueurM}×${l.hauteurM} m` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">{formatAr(l.prixApplique)}</td>
                  <td className="px-4 py-3 font-medium text-primary">{formatAr(l.montant)}</td>
                  <td className="px-4 py-3">
                    {isBrouillon && (
                      <SaleActionForm action={deleteLigne.bind(null, l.id, vente.id)}>
                        <Button aria-label="Retirer cette ligne et restituer le stock" variant="ghost" size="icon-sm" type="submit" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </SaleActionForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
