import { Input } from '@/components/ui/input'

export function AluFields() {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-orange-500/5 border border-orange-500/15">
      <div>
        <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Détails aluminium</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Le prix à la barre est saisi dans le champ "Prix de vente" ci-dessus.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Prix du pack (Ar) *</label>
          <Input name="prixPack" type="number" step="0.01" min="0" placeholder="0.00" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Nb barres / pack *</label>
          <Input name="nombreParPack" type="number" min="1" placeholder="ex: 6" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Emplacement</label>
          <Input name="emplacement" placeholder="ex: A-12" />
        </div>
      </div>
    </div>
  )
}
