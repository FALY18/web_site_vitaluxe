import { cn } from '@/lib/utils'
import type { TypeArticle, UniteVente } from '../types'
import { TYPE_LABELS, UNITE_LABELS } from '../types'

const TYPE_STYLE: Record<TypeArticle, string> = {
  vitre:      'bg-sky-500/10 text-sky-400 border-sky-500/20',
  alu:        'bg-orange-500/10 text-orange-400 border-orange-500/20',
  accessoire: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  service:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export function TypeBadge({ type }: { type: TypeArticle }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', TYPE_STYLE[type])}>
      {TYPE_LABELS[type]}
    </span>
  )
}

export function UniteBadge({ unite }: { unite: UniteVente }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-white/5 text-muted-foreground border-white/10">
      {UNITE_LABELS[unite]}
    </span>
  )
}
