'use client'

import { useActionState, useState } from 'react'
import { addLigne, deleteLigne } from '../action/vente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MODE_LABELS } from '../types'
import type { LigneFormState, ModeLigne, LigneVenteRow } from '../types'
import type { ArticleWithDetail } from '@/features/article/types'
import type { PlateauDisponible } from '../types'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

type Props = {
  venteId: number
  articles: ArticleWithDetail[]
  plateaux: PlateauDisponible[]
  lignes: LigneVenteRow[]
  onNext: () => void
}

const MODES: ModeLigne[] = ['decoupe', 'plateau_entier', 'plateau_gros', 'barre', 'pack', 'standard']
const initial: LigneFormState = {}

function formatAr(val: string) { return Number(val).toLocaleString('fr-MG') + ' Ar' }

export function StepLignes({ venteId, articles, plateaux, lignes, onNext }: Props) {
  const [mode, setMode] = useState<ModeLigne>('standard')
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithDetail | null>(null)

  const [state, action, pending] = useActionState(async (prev: LigneFormState, fd: FormData) => {
    return addLigne(prev, fd)
  }, initial)

  const needsPlateau = ['decoupe', 'plateau_entier', 'plateau_gros'].includes(mode)
  const needsDimensions = mode === 'decoupe'
  const plateauxFiltres = selectedArticle ? plateaux.filter((p) => p.articleId === selectedArticle.id) : plateaux
  const total = lignes.reduce((s, l) => s + Number(l.montant), 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Lignes existantes */}
      {lignes.length > 0 && (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/8 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {lignes.length} ligne{lignes.length > 1 ? 's' : ''}
            </p>
            <p className="text-sm font-semibold text-[#c8a96e]">{formatAr(total.toFixed(2))}</p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              {lignes.map((l) => (
                <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-medium">{l.articleDesignation}</p>
                    <p className="text-[10px] text-muted-foreground">{MODE_LABELS[l.mode]} · {l.nombre}×</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {l.longueurM && l.hauteurM ? `${l.longueurM}×${l.hauteurM}m` : `qté: ${l.quantiteFacturee}`}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium text-[#c8a96e]">{formatAr(l.montant)}</td>
                  <td className="px-4 py-2.5 w-10">
                    <form action={deleteLigne.bind(null, l.id, venteId)}>
                      <Button variant="ghost" size="icon-sm" type="submit" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulaire ajout ligne */}
      <form action={action} className="flex flex-col gap-4 p-4 rounded-xl bg-card ring-1 ring-foreground/10">
        <input type="hidden" name="venteId" value={venteId} />
        <input type="hidden" name="mode" value={mode} />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ajouter une ligne</p>

        {/* Mode */}
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
                mode === m ? 'bg-[#c8a96e]/15 text-[#c8a96e] border-[#c8a96e]/30' : 'text-muted-foreground border-white/10 hover:border-white/20'
              )}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
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
          {needsPlateau && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground">Plateau *</label>
              <select name="plateauId" required
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="" className="bg-[#111]">— Choisir —</option>
                {plateauxFiltres.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#111]">
                    {p.articleDesignation} · {p.longueurOrigineM}×{p.hauteurOrigineM}m · {p.surfaceRestanteM2}m²{p.emplacement ? ` · ${p.emplacement}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-3">
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

        <Button type="submit" disabled={pending} size="sm" className="self-start">
          {pending ? 'Ajout…' : '+ Ajouter'}
        </Button>
      </form>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={lignes.length === 0}>
          Voir le résumé →
        </Button>
      </div>
    </div>
  )
}
