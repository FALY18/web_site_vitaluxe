import Link from 'next/link'
import { StatutBadge } from './vente-statut-badge'
import { deleteVente } from '../action/vente'
import { Button } from '@/components/ui/button'
import { Eye, Trash2 } from 'lucide-react'
import type { VenteRow } from '../types'

function formatAr(val: string) {
  return Number(val).toLocaleString('fr-MG') + ' Ar'
}

export function VenteTable({ ventes }: { ventes: VenteRow[] }) {
  if (ventes.length === 0) {
    return (
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-12 text-center text-sm text-muted-foreground">
        Aucune vente. Créez la première vente.
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/8">
            {['N° Bon', 'Date', 'Client', 'Commercial', 'Total', 'Statut', ''].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ventes.map((v) => (
            <tr key={v.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
              <td className="px-4 py-3 font-mono font-semibold text-[#c8a96e]">#{v.numero}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(v.date).toLocaleDateString('fr-FR')}</td>
              <td className="px-4 py-3 font-medium">{v.clientNom}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{v.commercialNom}</td>
              <td className="px-4 py-3 font-medium">{formatAr(v.total)}</td>
              <td className="px-4 py-3"><StatutBadge statut={v.statut} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  <Link href={`/dashboard/ventes/${v.id}`}>
                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                      <Eye className="size-3.5" />
                    </Button>
                  </Link>
                  {v.statut === 'brouillon' && (
                    <form action={deleteVente.bind(null, v.id)}>
                      <Button variant="ghost" size="icon-sm" type="submit" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
