'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export type StepId = 'client' | 'lignes' | 'resume'

const STEPS: { id: StepId; label: string; desc: string }[] = [
  { id: 'client', label: 'Client',  desc: 'Informations client' },
  { id: 'lignes', label: 'Articles', desc: 'Lignes de vente' },
  { id: 'resume', label: 'Résumé',  desc: 'Confirmation' },
]

export function StepIndicator({ current }: { current: StepId }) {
  const idx = STEPS.findIndex((s) => s.id === current)
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                'size-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                done   ? 'bg-[#c8a96e] border-[#c8a96e] text-black' :
                active ? 'bg-[#c8a96e]/15 border-[#c8a96e] text-[#c8a96e]' :
                         'bg-transparent border-white/20 text-muted-foreground'
              )}>
                {done ? <Check className="size-4" /> : i + 1}
              </div>
              <span className={cn('text-[10px] font-medium whitespace-nowrap',
                active ? 'text-[#c8a96e]' : done ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-px w-16 mx-2 mb-4 transition-all', i < idx ? 'bg-[#c8a96e]' : 'bg-white/15')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
