import { updateStatutVente } from '../action/vente'
import { Button } from '@/components/ui/button'
import { StatutBadge } from './vente-statut-badge'
import { MODE_LABELS } from '../types'
import type { VenteDetail } from '../types'
import { Check, FileText } from 'lucide-react'

function formatAr(val: string) { return Number(val).toLocaleString('fr-MG') + ' Ar' }

export function StepResume({ vente }: { vente: VenteDetail }) {
  const total = vente.lignes.reduce((s, l) => s + Number(l.montant), 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Header résumé */}
      <div className="rounded-xl bg-[#c8a96e]/5 border border-[#c8a96e]/20 p-5 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[#c8a96e]" />
            <span className="text-xs font-semibold text-[#c8a96e] uppercase tracking-wider">Bon de vente</span>
            <StatutBadge statut={vente.statut} />
          </div>
          <p className="text-sm"><span className="text-muted-foreground">Client : </span><span className="font-semibold">{vente.clientNom}</span></p>
          {vente.clientTelephone && <p className="text-xs text-muted-foreground">{vente.clientTelephone}</p>}
          <p className="text-xs text-muted-foreground">
            {new Date(vente.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}<span className="font-medium text-foreground">{vente.commercialNom}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <p className="text-3xl font-heading font-bold text-[#c8a96e]">{formatAr(total.toFixed(2))}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{vente.lignes.length} ligne{vente.lignes.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Lignes */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Détail des articles</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Article</th>
              <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Mode</th>
              <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Qté / Dim.</th>
              <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Prix unit.</th>
              <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            {vente.lignes.map((l) => (
              <tr key={l.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-xs">{l.articleDesignation}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{l.articleCode}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{MODE_LABELS[l.mode]}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {l.longueurM && l.hauteurM
                    ? `${l.nombre}× · ${l.longueurM}×${l.hauteurM}m = ${l.quantiteFacturee}m²`
                    : `${l.nombre}×`}
                </td>
                <td className="px-4 py-3 text-right text-xs">{formatAr(l.prixApplique)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#c8a96e]">{formatAr(l.montant)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/15 bg-white/3">
              <td colSpan={4} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</td>
              <td className="px-4 py-3 text-right text-base font-bold text-[#c8a96e]">{formatAr(total.toFixed(2))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action confirmation */}
      {vente.statut === 'brouillon' && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-card ring-1 ring-foreground/10">
          <div>
            <p className="text-sm font-medium">Confirmer la vente</p>
            <p className="text-xs text-muted-foreground mt-0.5">La vente sera validée et ne pourra plus être modifiée.</p>
          </div>
          <form action={updateStatutVente.bind(null, vente.id, 'confirmee')}>
            <Button type="submit">
              <Check className="size-4" />Confirmer
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
