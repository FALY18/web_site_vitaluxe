import { Input } from '@/components/ui/input'

export function VitreFields() {
  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg bg-sky-500/5 border border-sky-500/15">
      <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Détails vitre</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Épaisseur (mm) *</label>
          <Input name="epaisseurMm" type="number" step="0.1" min="0.1" placeholder="6.0" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Prix plateau entier (Ar) *</label>
          <Input name="prixPlateauEntier" type="number" step="0.01" min="0" placeholder="0.00" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Prix plateau gros (Ar)</label>
          <Input name="prixPlateauGros" type="number" step="0.01" min="0" placeholder="Optionnel" />
        </div>
      </div>
    </div>
  )
}
