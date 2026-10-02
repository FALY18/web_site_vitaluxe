import { STATUT_LABELS, STATUT_STYLE } from '../types'
import type { StatutVente } from '../types'

export function StatutBadge({ statut }: { statut: StatutVente }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${STATUT_STYLE[statut]}`}>
      {STATUT_LABELS[statut]}
    </span>
  )
}
