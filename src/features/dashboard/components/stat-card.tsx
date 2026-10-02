import { cn } from '@/lib/utils'
import type { StatCardData } from '../types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const trendIcon = {
  up: <TrendingUp className="size-3.5 text-emerald-400" />,
  down: <TrendingDown className="size-3.5 text-red-400" />,
  neutral: <Minus className="size-3.5 text-muted-foreground" />,
}

const trendColor = {
  up: 'text-emerald-400',
  down: 'text-red-400',
  neutral: 'text-muted-foreground',
}

export function StatCard({ label, value, sub, trend = 'neutral' }: StatCardData) {
  return (
    <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-5 flex flex-col gap-3">
      <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-heading font-semibold">{value}</p>
      {sub && (
        <div className={cn('flex items-center gap-1.5 text-xs', trendColor[trend])}>
          {trendIcon[trend]}
          <span>{sub}</span>
        </div>
      )}
    </div>
  )
}
