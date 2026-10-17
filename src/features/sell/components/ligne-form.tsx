'use client'

import { useActionState, useState } from 'react'
import { addLigne } from '../action/vente'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MODE_LABELS } from '../types'
import type { LigneFormState, ModeLigne, PlateauDisponible } from '../types'
import type { ArticleWithDetail } from '@/features/article/types'
import { cutQuantity, lineAmounts, modesForArticle, surfaceAfterSale } from '../lib/rules'

type Props = { venteId: number; articles: ArticleWithDetail[]; plateaux: PlateauDisponible[] }

function articleLabel(article: ArticleWithDetail) {
  const thickness = article.vitreDetail?.epaisseurMm
  return [
    article.designation,
    article.type === 'vitre' ? thickness != null ? `${Number(thickness).toLocaleString('fr-FR')} mm` : 'Épaisseur non renseignée' : null,
    article.couleur,
  ].filter(Boolean).join(' · ')
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase('fr').replace(/,/g, '.').replace(/\s+/g, '')
}

export function LigneForm({ venteId, articles, plateaux }: Props) {
  const [articleId, setArticleId] = useState('')
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<ModeLigne>('standard')
  const [sheetId, setSheetId] = useState('')
  const [nombre, setNombre] = useState('1')
  const [length, setLength] = useState('')
  const [height, setHeight] = useState('')
  const [customPrice, setCustomPrice] = useState('')
  const item = articles.find(a => String(a.id) === articleId)
  const modes = item ? modesForArticle(item.type, item.vitreDetail?.prixPlateauGros != null) : []
  const needsPlateau = item?.type === 'vitre'
  const whole = mode === 'plateau_entier' || mode === 'plateau_gros'
  const sheets = plateaux.filter(p => p.articleId === item?.id && (!whole || Number(p.surfaceRestanteM2) === Number((Number(p.longueurOrigineM) * Number(p.hauteurOrigineM)).toFixed(2))))
  const sheet = sheets.find(p => String(p.id) === sheetId)
  const price = item?.type === 'vitre'
    ? mode === 'decoupe' ? item.prixVente : mode === 'plateau_gros' ? item.vitreDetail?.prixPlateauGros : item.vitreDetail?.prixPlateauEntier
    : item?.type === 'alu' ? mode === 'pack' ? item.aluDetail?.prixPack : item.prixVente : customPrice
  const validCount = Number.isInteger(Number(nombre)) && Number(nombre) > 0 && Number(nombre) <= 2147483647
  const validDimensions = Number(length) > 0 && Number(length) <= 999.999 && Number(height) > 0 && Number(height) <= 999.999
  const quantity = !validCount ? 0 : mode === 'decoupe'
    ? validDimensions ? cutQuantity(Number(length), Number(height), Number(nombre)) : 0
    : Number(nombre)
  let preview: ReturnType<typeof lineAmounts> | null = null
  try { if (price) preview = lineAmounts(quantity, price) } catch { /* Incomplete input is not a billable line. */ }
  let remainingPreview: string | null = null
  let stockError: string | null = null
  if (sheet && preview) {
    try { remainingPreview = surfaceAfterSale(sheet.surfaceRestanteM2, whole ? Number(sheet.surfaceRestanteM2) : quantity) }
    catch { stockError = 'La surface demandée dépasse le reste disponible du plateau.' }
  }
  const selectedItems = articles.filter(a => String(a.id) === articleId || normalizeSearch(`${a.code} ${articleLabel(a)}`).includes(normalizeSearch(search)))
  const [state, action, pending] = useActionState(async (prev: LigneFormState, data: FormData) => {
    const result = await addLigne(prev, data)
    if (result.success) {
      setNombre('1')
      setLength('')
      setHeight('')
      setSheetId('')
    }
    return result
  }, {} as LigneFormState)
  const selectClass = 'h-10 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm'

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="venteId" value={venteId} />
      <input type="hidden" name="mode" value={mode} />
      <div className="grid gap-1.5">
        <label htmlFor="sale-search" className="text-xs font-medium text-muted-foreground">Rechercher un article</label>
        <Input id="sale-search" type="search" placeholder="Désignation, épaisseur (6 mm), couleur…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="sale-article" className="text-xs font-medium text-muted-foreground">Article *</label>
        <select id="sale-article" name="articleId" value={articleId} required className={selectClass} onChange={e => {
          const next = articles.find(a => String(a.id) === e.target.value)
          setArticleId(e.target.value)
          setMode(next ? modesForArticle(next.type, next.vitreDetail?.prixPlateauGros != null)[0] : 'standard')
          setCustomPrice(next?.prixVente ?? '')
          setSheetId('')
          setNombre('1')
        }}>
          <option value="">Choisir un article</option>
          {selectedItems.map(a => <option key={a.id} value={a.id}>{articleLabel(a)}</option>)}
        </select>
        {selectedItems.length === 0 && <p className="text-xs text-muted-foreground">Aucun article correspondant.</p>}
      </div>
      {item && <>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="sale-mode" className="text-xs font-medium text-muted-foreground">Mode de vente</label>
            <select id="sale-mode" value={mode} className={selectClass} onChange={e => { setMode(e.target.value as ModeLigne); setSheetId(''); setNombre('1') }}>
              {modes.map(m => <option key={m} value={m}>{MODE_LABELS[m]}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="sale-count" className="text-xs font-medium text-muted-foreground">{mode === 'pack' ? 'Nombre de packs' : 'Nombre'} *</label>
            <Input id="sale-count" name="nombre" type="number" min="1" max={whole ? '1' : '2147483647'} step="1" value={whole ? '1' : nombre} readOnly={whole} onChange={e => setNombre(e.target.value)} required />
          </div>
        </div>
        {needsPlateau && <div className="grid gap-1.5">
          <label htmlFor="sale-sheet" className="text-xs font-medium text-muted-foreground">Plateau disponible *</label>
          <select id="sale-sheet" name="plateauId" value={sheet ? sheetId : ''} required className={selectClass} onChange={e => setSheetId(e.target.value)}>
            <option value="">Choisir un plateau</option>
            {sheets.map(p => <option key={p.id} value={p.id}>#{p.id} · {p.longueurOrigineM} × {p.hauteurOrigineM} m · {p.surfaceRestanteM2} m²{p.emplacement ? ` · ${p.emplacement}` : ''}</option>)}
          </select>
          {sheets.length === 0 && <p role="status" className="text-xs text-destructive">Aucun plateau disponible pour ce mode.</p>}
        </div>}
        {mode === 'decoupe' && <>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="sale-length" className="text-xs font-medium text-muted-foreground">Longueur (m) *</label>
              <Input id="sale-length" name="longueurM" type="number" step="0.001" min="0.001" max="999.999" value={length} onChange={e => setLength(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="sale-height" className="text-xs font-medium text-muted-foreground">Hauteur (m) *</label>
              <Input id="sale-height" name="hauteurM" type="number" step="0.001" min="0.001" max="999.999" value={height} onChange={e => setHeight(e.target.value)} required />
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">Surface arrondie à 0,01 m². La disposition réelle des découpes doit être vérifiée au dépôt.</p>
        </>}
        {item.type === 'alu' && <p className="text-xs text-muted-foreground">Stock : {item.aluDetail?.stockBarres ?? 0} barres{mode === 'pack' ? ` · ${item.aluDetail?.nombreParPack ?? 0} barres par pack` : ''}.</p>}
        <div className="grid gap-1.5">
          <label htmlFor="sale-price" className="text-xs font-medium text-muted-foreground">Prix {mode === 'decoupe' ? 'au m²' : mode === 'pack' ? 'par pack' : 'unitaire'} (Ar){item.type === 'vitre' || item.type === 'alu' ? ' · tarif catalogue' : ''}</label>
          <Input id="sale-price" name="prixApplique" type="number" step="0.01" min="0" value={price ?? ''} readOnly={item.type === 'vitre' || item.type === 'alu'} onChange={e => setCustomPrice(e.target.value)} required />
        </div>
      </>}
      <div className="sticky bottom-0 z-10 mt-1 grid gap-3 border-t border-border bg-card pt-3">
        <div className="flex items-center justify-between gap-3 text-sm" aria-live="polite">
          <span className="text-muted-foreground">{preview ? `${preview.quantiteFacturee} ${mode === 'decoupe' ? 'm²' : mode === 'pack' ? 'pack(s)' : 'unité(s)'}` : 'Montant de la ligne'}</span>
          <strong className="text-primary">{preview ? `${Number(preview.montant).toLocaleString('fr-FR')} Ar` : '—'}</strong>
        </div>
        {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
        {remainingPreview != null && <p aria-live="polite" className="rounded-lg bg-muted p-2 text-xs">Plateau #{sheet?.id} : {sheet?.surfaceRestanteM2} m² disponibles → <strong>{remainingPreview} m² après cette ligne</strong></p>}
        {stockError && <p role="alert" className="text-xs text-destructive">{stockError}</p>}
        {state.success && <p role="status" className="text-xs text-emerald-700">Ligne ajoutée au bon.{state.plateauId != null && <> Plateau #{state.plateauId} : reste enregistré {state.surfaceRestanteM2} m².</>}</p>}
        <Button type="submit" disabled={pending || !item || !preview || Boolean(stockError) || (needsPlateau && !sheet)} className="w-full">{pending ? 'Ajout…' : 'Ajouter au bon'}</Button>
        <p className="text-[11px] text-muted-foreground">Le stock est déduit dès l’ajout au brouillon et restitué en cas d’annulation.</p>
      </div>
    </form>
  )
}
