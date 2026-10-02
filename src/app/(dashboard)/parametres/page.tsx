import { PageHeader } from '@/features/dashboard/components/page-header'
import { db } from '@/db'
import { parametreSociete } from '@/db/schema'

export default async function ParametresPage() {
  const [params] = await db.select().from(parametreSociete).limit(1)

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader title="Paramètres" description="Configuration de la société" />
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 divide-y divide-white/8">
        {([
          ['Société', params?.nom],
          ['Adresse', params?.adresse],
          ['Téléphone', params?.telephone],
          ['NIF', params?.nif],
          ['STAT', params?.stat],
          ['Tolérance mesure', params?.toleranceMesureM ? `${params.toleranceMesureM} m` : null],
        ] as [string, string | null | undefined][]).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className="text-sm font-medium">{value ?? '—'}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 divide-y divide-white/8">
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Numérotation automatique</p>
          <p className="text-xs text-muted-foreground">
            Ventes : séquence <span className="font-mono text-foreground">seq_numero_vente</span> (depuis 1147) ·
            Factures : <span className="font-mono text-foreground">FAC-000001</span> ·
            Articles : <span className="font-mono text-foreground">VIT / ALU / ACC</span>
          </p>
        </div>
      </div>
    </div>
  )
}
