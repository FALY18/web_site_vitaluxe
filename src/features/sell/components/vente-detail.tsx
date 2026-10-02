import { deleteLigne, updateStatutVente } from '../action/vente'
import { StatutBadge } from './vente-statut-badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { MODE_LABELS } from '../types'
import type { VenteDetail } from '../types'

function formatAr(val: string) {
  return Number(val).toLocaleString('fr-MG') + ' Ar'
}

export function VenteDetailView({ vente }: { vente: VenteDetail }) {
  const isBrouillon = vente.statut === 'brouillon'

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-5 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-heading font-bold text-[#c8a96e]">#{vente.numero}</span>
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
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <p className="text-xl font-heading font-bold">{formatAr(vente.total)}</p>
        </div>
      </div>

      {/* Actions statut */}
      {isBrouillon && (
        <div className="flex gap-2">
          <form action={updateStatutVente.bind(null, vente.id, 'confirmee')}>
            <Button size="sm" type="submit">Confirmer la vente</Button>
          </form>
          <form action={updateStatutVente.bind(null, vente.id, 'annulee')}>
            <Button size="sm" variant="destructive" type="submit">Annuler</Button>
          </form>
        </div>
      )}
      {vente.statut === 'confirmee' && (
        <form action={updateStatutVente.bind(null, vente.id, 'livree')}>
          <Button size="sm" type="submit">Marquer comme livrée</Button>
        </form>
      )}

      {/* Lignes */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Lignes ({vente.lignes.length})
          </p>
        </div>
        {vente.lignes.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune ligne. Ajoutez des articles ci-dessous.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Article', 'Mode', 'Qté', 'Dimensions', 'Prix unit.', 'Montant', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vente.lignes.map((l) => (
                <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{l.articleDesignation}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{l.articleCode}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{MODE_LABELS[l.mode]}</td>
                  <td className="px-4 py-3 text-xs">{l.nombre}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {l.longueurM && l.hauteurM ? `${l.longueurM}×${l.hauteurM} m` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">{formatAr(l.prixApplique)}</td>
                  <td className="px-4 py-3 font-medium text-[#c8a96e]">{formatAr(l.montant)}</td>
                  <td className="px-4 py-3">
                    {isBrouillon && (
                      <form action={deleteLigne.bind(null, l.id, vente.id)}>
                        <Button variant="ghost" size="icon-sm" type="submit" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </form>
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
