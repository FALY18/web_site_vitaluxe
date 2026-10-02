'use client'

import { useActionState, useState } from 'react'
import { addLigne } from '../action/vente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MODE_LABELS } from '../types'
import type { LigneFormState, ModeLigne } from '../types'
import type { ArticleWithDetail } from '@/features/article/types'
import type { PlateauDisponible } from '../types'
import { cn } from '@/lib/utils'

type Props = {
  venteId: number
  articles: ArticleWithDetail[]
  plateaux: PlateauDisponible[]
}

const MODES: ModeLigne[] = ['decoupe', 'plateau_entier', 'plateau_gros', 'barre', 'pack', 'standard']
const initial: LigneFormState = {}

export function LigneForm({ venteId, articles, plateaux }: Props) {
  const [mode, setMode] = useState<ModeLigne>('standard')
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithDetail | null>(null)

  const [state, action, pending] = useActionState(async (prev: LigneFormState, fd: FormData) => {
    const res = await addLigne(prev, fd)
    return res
  }, initial)

  const needsPlateau = ['decoupe', 'plateau_entier', 'plateau_gros'].includes(mode)
  const needsDimensions = mode === 'decoupe'
  const plateauxFiltres = selectedArticle
    ? plateaux.filter((p) => p.articleId === selectedArticle.id)
    : plateaux

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="venteId" value={venteId} />
      <input type="hidden" name="mode" value={mode} />

      {/* Mode */}
      <div className="flex flex-col gap-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wider">Mode de vente</label>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                mode === m
                  ? 'bg-[#c8a96e]/15 text-[#c8a96e] border-[#c8a96e]/30'
                  : 'text-muted-foreground border-white/10 hover:border-white/20'
              )}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Article */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Article *</label>
          <select name="articleId" required
            onChange={(e) => setSelectedArticle(articles.find((a) => a.id === Number(e.target.value)) ?? null)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="" className="bg-[#111]">— Choisir —</option>
            {articles.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#111]">{a.code} · {a.designation}</option>
            ))}
          </select>
        </div>

        {/* Plateau si nécessaire */}
        {needsPlateau && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Plateau *</label>
            <select name="plateauId" required
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              <option value="" className="bg-[#111]">— Choisir —</option>
              {plateauxFiltres.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#111]">
                  {p.articleDesignation} · {p.longueurOrigineM}×{p.hauteurOrigineM}m · {p.surfaceRestanteM2}m² restant
                  {p.emplacement ? ` · ${p.emplacement}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Nombre *</label>
          <Input name="nombre" type="number" min="1" defaultValue="1" required />
        </div>

        {needsDimensions && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Longueur (m) *</label>
              <Input name="longueurM" type="number" step="0.001" min="0.001" placeholder="1.200" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Hauteur (m) *</label>
              <Input name="hauteurM" type="number" step="0.001" min="0.001" placeholder="0.800" required />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Prix appliqué (Ar) *</label>
          <Input name="prixApplique" type="number" step="0.01" min="0" required
            defaultValue={selectedArticle?.prixVente ?? ''} placeholder="0.00" />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-400">✓ Ligne ajoutée.</p>}

      <Button type="submit" disabled={pending} size="sm" className="self-end">
        {pending ? 'Ajout…' : '+ Ajouter la ligne'}
      </Button>
    </form>
  )
}
