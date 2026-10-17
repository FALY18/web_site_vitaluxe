import { Building2, Hash, Info, Ruler } from 'lucide-react'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { db } from '@/db'
import { parametreSociete } from '@/db/schema'

export default async function ParametresPage() {
  const [params] = await db.select().from(parametreSociete).limit(1)
  const fields = [
    ['Nom de la société', params?.nom],
    ['Adresse', params?.adresse],
    ['Téléphone', params?.telephone],
    ['NIF', params?.nif],
    ['STAT', params?.stat],
  ] as const

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Paramètres" description="Informations de votre société et règles de gestion." />
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">Ces paramètres sont consultables en lecture seule. Pour les modifier, contactez la personne responsable de la configuration.</p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="company-title" className="overflow-hidden rounded-2xl border border-foreground/10 bg-card">
          <div className="flex items-center gap-3 border-b border-foreground/8 p-5 sm:p-6">
            <Building2 aria-hidden="true" className="size-5 shrink-0 text-primary" />
            <div>
              <h2 id="company-title" className="text-base font-semibold">Informations de la société</h2>
              <p className="mt-1 text-sm text-muted-foreground">Identité, coordonnées et références fiscales</p>
            </div>
          </div>
          {!params && <p role="status" className="px-6 pt-5 text-sm text-amber-300">Aucune configuration de société enregistrée.</p>}
          <dl className="divide-y divide-foreground/8 px-5 sm:px-6">
            {fields.map(([label, value]) => (
              <div key={label} className="grid gap-2 py-5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-5">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className={`break-words text-sm leading-relaxed ${value?.trim() ? 'font-medium' : 'text-muted-foreground italic'}`}>{value?.trim() || 'Non renseigné'}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="grid gap-6">
          <section aria-labelledby="measure-title" className="rounded-2xl border border-foreground/10 bg-card p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-3">
              <Ruler aria-hidden="true" className="size-5 text-primary" />
              <h2 id="measure-title" className="text-base font-semibold">Tolérance de mesure</h2>
            </div>
            <p className="text-3xl font-semibold tabular-nums">
              {params?.toleranceMesureM != null ? <>{new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(params.toleranceMesureM))} <span className="text-base font-normal text-muted-foreground">m</span></> : <span className="text-base text-muted-foreground">Non renseignée</span>}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Marge de tolérance configurée pour les mesures, exprimée en mètres.</p>
          </section>
          <section aria-labelledby="numbering-title" className="rounded-2xl border border-foreground/10 bg-card p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Hash aria-hidden="true" className="size-5 text-primary" />
              <h2 id="numbering-title" className="text-base font-semibold">Numérotation automatique</h2>
            </div>
            <dl className="grid gap-5 text-sm">
              {[
                ['Ventes', 'Séquence automatique à partir de 1147', '1147, 1148…'],
                ['Factures', 'Préfixe suivi de six chiffres', 'FAC-000001'],
                ['Articles', 'Préfixe selon la catégorie', 'VIT / ALU / ACC'],
              ].map(([label, description, example]) => (
                <div key={label}>
                  <dt className="font-medium">{label}</dt>
                  <dd className="mt-1 space-y-2">
                    <p className="text-muted-foreground leading-relaxed">{description}</p>
                    <span className="inline-block rounded-md border border-foreground/10 bg-foreground/5 px-2.5 py-1 font-mono text-xs text-primary">{example}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}
