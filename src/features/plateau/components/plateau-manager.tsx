'use client'

import { useActionState, useState } from 'react'
import { createPlateau, deletePlateau, updateStatutPlateau, updatePlateauEmplacement } from '../action/plateau'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { STATUT_PLATEAU_LABELS, STATUT_PLATEAU_STYLE } from '../types'
import type { PlateauRow, PlateauFormState, StatutPlateau } from '../types'
import { cn } from '@/lib/utils'
import { Plus, Trash2, MapPin, X, Check } from 'lucide-react'

type Props = {
  plateaux: PlateauRow[]
  articlesVitre: { id: number; code: string; designation: string }[]
}

const initial: PlateauFormState = {}

function StatutBadge({ statut }: { statut: StatutPlateau }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', STATUT_PLATEAU_STYLE[statut])}>
      {STATUT_PLATEAU_LABELS[statut]}
    </span>
  )
}

function CreateForm({ articlesVitre }: { articlesVitre: Props['articlesVitre'] }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(async (prev: PlateauFormState, fd: FormData) => {
    const res = await createPlateau(prev, fd)
    if (res.success) setOpen(false)
    return res
  }, initial)

  if (!open) return (
    <Button size="sm" onClick={() => setOpen(true)}>
      <Plus className="size-4" />Nouveau plateau
    </Button>
  )

  return (
    <form action={action} className="p-4 rounded-xl bg-card ring-1 ring-foreground/10 flex flex-col gap-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nouveau plateau</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Article vitre *</label>
          <select name="articleId" required
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="" className="bg-[#111]">— Choisir —</option>
            {articlesVitre.map((a) => (
              <option key={a.id} value={a.id} className="bg-[#111]">{a.code} · {a.designation}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Emplacement</label>
          <Input name="emplacement" placeholder="ex: A-01, Rack 3…" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Longueur origine (m) *</label>
          <Input name="longueurOrigineM" type="number" step="0.001" min="0.001" placeholder="ex: 3.210" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Hauteur origine (m) *</label>
          <Input name="hauteurOrigineM" type="number" step="0.001" min="0.001" placeholder="ex: 2.250" required />
        </div>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" type="button" onClick={() => setOpen(false)}><X className="size-4" />Annuler</Button>
        <Button size="sm" type="submit" disabled={pending}><Check className="size-4" />{pending ? 'Création…' : 'Créer'}</Button>
      </div>
    </form>
  )
}

function EmplacementEdit({ id, current }: { id: number; current: string | null }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(current ?? '')

  if (!editing) return (
    <button onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
      <MapPin className="size-3" />
      {current ?? <span className="italic">—</span>}
    </button>
  )

  return (
    <form action={async () => { await updatePlateauEmplacement(id, val); setEditing(false) }}
      className="flex items-center gap-1">
      <Input value={val} onChange={(e) => setVal(e.target.value)}
        className="h-6 text-xs w-24" autoFocus />
      <button type="submit" className="text-emerald-400 hover:text-emerald-300"><Check className="size-3.5" /></button>
      <button type="button" onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
    </form>
  )
}

export function PlateauManager({ plateaux, articlesVitre }: Props) {
  const disponibles = plateaux.filter((p) => p.statut === 'disponible')
  const autres = plateaux.filter((p) => p.statut !== 'disponible')

  return (
    <div className="flex flex-col gap-4">
      <CreateForm articlesVitre={articlesVitre} />

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        {(['disponible', 'epuise', 'vendu_entier'] as StatutPlateau[]).map((s) => (
          <div key={s} className="rounded-xl bg-card ring-1 ring-foreground/10 p-4 flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{STATUT_PLATEAU_LABELS[s]}</p>
            <p className="text-2xl font-heading font-semibold">{plateaux.filter((p) => p.statut === s).length}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {['Article', 'Dimensions', 'Surface restante', 'Emplacement', 'Statut', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plateaux.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun plateau.</td></tr>
            )}
            {plateaux.map((p) => (
              <tr key={p.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-xs">{p.articleDesignation}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{p.articleCode}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                  {p.longueurOrigineM} × {p.hauteurOrigineM} m
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-sm font-semibold', Number(p.surfaceRestanteM2) < 1 ? 'text-red-400' : 'text-emerald-400')}>
                    {p.surfaceRestanteM2} m²
                  </span>
                </td>
                <td className="px-4 py-3">
                  <EmplacementEdit id={p.id} current={p.emplacement} />
                </td>
                <td className="px-4 py-3">
                  <select
                    defaultValue={p.statut}
                    onChange={(e) => updateStatutPlateau(p.id, e.target.value as StatutPlateau)}
                    className="h-7 rounded-lg border border-input bg-transparent px-2 text-xs text-foreground outline-none focus-visible:border-ring">
                    {(['disponible', 'epuise', 'vendu_entier'] as StatutPlateau[]).map((s) => (
                      <option key={s} value={s} className="bg-[#111]">{STATUT_PLATEAU_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <form action={deletePlateau.bind(null, p.id)}>
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
    </div>
  )
}
