'use client'

import { useActionState, useState } from 'react'
import { createArticle } from '../action/article'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VitreFields } from './vitre-fields'
import { AluFields } from './alu-fields'
import { TYPE_LABELS, TYPE_UNITES, TYPE_UNITE_DEFAULT, UNITE_LABELS } from '../types'
import type { ArticleFormState, TypeArticle, UniteVente } from '../types'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'

type Props = {
  categories: { id: number; nom: string }[]
  onSuccess?: () => void
}

const initial: ArticleFormState = {}

const TYPES: TypeArticle[] = ['vitre', 'alu', 'accessoire', 'service']

const TYPE_COLOR: Record<TypeArticle, string> = {
  vitre:      'border-sky-500/40 bg-sky-500/10 text-sky-400',
  alu:        'border-orange-500/40 bg-orange-500/10 text-orange-400',
  accessoire: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  service:    'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
}

const CODE_AUTO_PREVIEW: Record<TypeArticle, string | null> = {
  vitre:      'VIT-000001',
  alu:        'ALU-000001',
  accessoire: 'ACC-000001',
  service:    null,
}

// Label du champ "Prix de vente" selon le type
const PRIX_LABEL: Record<TypeArticle, string> = {
  vitre:      'Prix au m² (Ar) *',
  alu:        'Prix à la barre (Ar) *',
  accessoire: 'Prix unitaire (Ar) *',
  service:    'Prix (Ar) *',
}

const PRIX_PLACEHOLDER: Record<TypeArticle, string> = {
  vitre:      'ex: 45 000',
  alu:        'ex: 12 000',
  accessoire: 'ex: 3 500',
  service:    'ex: 50 000',
}

export function ArticleForm({ categories, onSuccess }: Props) {
  const [type, setType] = useState<TypeArticle>('vitre')

  const [state, action, pending] = useActionState(async (prev: ArticleFormState, fd: FormData) => {
    const res = await createArticle(prev, fd)
    if (res.success) onSuccess?.()
    return res
  }, initial)

  const isAutoCode = type !== 'service'
  const unitesDisponibles: UniteVente[] = TYPE_UNITES[type]

  return (
    <form action={action} className="flex flex-col gap-5">

      {/* Sélecteur de type */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Type d'article *
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((t) => (
            <button key={t} type="button" onClick={() => setType(t)}
              className={cn(
                'px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all text-center',
                type === t ? TYPE_COLOR[t] : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
              )}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={type} />
      </div>

      {/* Code + Désignation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground flex items-center gap-1.5">
            Code article
            {isAutoCode ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#c8a96e]/10 text-[#c8a96e] border border-[#c8a96e]/20">
              </span>
            ) : (
              <span className="text-destructive">*</span>
            )}
          </label>
          {isAutoCode ? (
            <div className="h-8 flex items-center px-2.5 rounded-lg border border-dashed border-white/15 bg-white/3 text-xs text-muted-foreground font-mono">
              ex : {CODE_AUTO_PREVIEW[type]}
            </div>
          ) : (
            <Input name="code" required placeholder="ex: SRV-POSE" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Désignation *</label>
          <Input name="designation" required placeholder="ex: Vitre claire 6mm" />
        </div>
      </div>

      {/* Catégorie + Couleur */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Catégorie *</label>
          <select name="categorieId" required
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#111]">{c.nom}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Couleur / Finition</label>
          <Input name="couleur" placeholder="ex: Clair, Bronze, Anodisé…" />
        </div>
      </div>

      {/* Unité + Prix — contextuels selon type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Unité de vente *</label>
          <select name="uniteVente" required key={type}
            defaultValue={TYPE_UNITE_DEFAULT[type]}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            {unitesDisponibles.map((u) => (
              <option key={u} value={u} className="bg-[#111]">{UNITE_LABELS[u]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">{PRIX_LABEL[type]}</label>
          <Input name="prixVente" type="number" step="0.01" min="0" required
            placeholder={PRIX_PLACEHOLDER[type]} />
        </div>
      </div>

      {/* Champs spécifiques par type */}
      {type === 'vitre' && <VitreFields />}
      {type === 'alu' && <AluFields />}

      {/* Accessoire : info contextuelle */}
      {type === 'accessoire' && (
        <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/15">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Accessoire</p>
          <p className="text-[11px] text-muted-foreground">
            Vendu à l'unité, en pack ou en standard selon l'unité choisie ci-dessus.
            Le prix saisi est le prix de base (unitaire ou par pack).
          </p>
        </div>
      )}

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-400">✓ Article créé avec succès.</p>}

      <Button type="submit" disabled={pending} size="sm" className="self-end">
        {pending ? 'Création…' : "Créer l'article"}
      </Button>
    </form>
  )
}
