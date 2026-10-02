'use client'

import { useState } from 'react'
import { ArticleTable } from './article-table'
import { TYPE_LABELS } from '../types'
import { cn } from '@/lib/utils'
import type { ArticleWithDetail, TypeArticle } from '../types'
import type { Role } from '@/features/auth/types'

const FILTERS: { value: TypeArticle | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'vitre', label: 'Vitres' },
  { value: 'alu', label: 'Aluminium' },
  { value: 'accessoire', label: 'Accessoires' },
  { value: 'service', label: 'Services' },
]

export function ArticleList({ articles, role }: { articles: ArticleWithDetail[], role: Role }) {
  const [filter, setFilter] = useState<TypeArticle | 'all'>('all')

  const filtered = filter === 'all' ? articles : articles.filter((a) => a.type === filter)

  const counts = {
    all: articles.length,
    vitre: articles.filter((a) => a.type === 'vitre').length,
    alu: articles.filter((a) => a.type === 'alu').length,
    accessoire: articles.filter((a) => a.type === 'accessoire').length,
    service: articles.filter((a) => a.type === 'service').length,
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              filter === value
                ? 'bg-[#c8a96e]/15 text-[#c8a96e] border-[#c8a96e]/30'
                : 'text-muted-foreground border-white/10 hover:border-white/20 hover:text-foreground'
            )}
          >
            {label}
            <span className={cn(
              'px-1.5 py-0.5 rounded text-[10px] font-semibold',
              filter === value ? 'bg-[#c8a96e]/20' : 'bg-white/8'
            )}>
              {counts[value]}
            </span>
          </button>
        ))}
      </div>

      <ArticleTable articles={filtered} role={role} />
    </div>
  )
}
