import { getPlateaux, getArticlesVitre } from '@/features/plateau/queries/plateau'
import { PlateauManager } from '@/features/plateau/components/plateau-manager'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { getSession } from '@/features/auth/session'
import { redirect } from 'next/navigation'

export default async function PlateauxPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [plateaux, articlesVitre] = await Promise.all([getPlateaux(), getArticlesVitre()])

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Plateaux"
        description={`${plateaux.length} plateau${plateaux.length > 1 ? 'x' : ''} · ${plateaux.filter((p) => p.statut === 'disponible').length} disponible${plateaux.filter((p) => p.statut === 'disponible').length > 1 ? 's' : ''}`}
      />
      <PlateauManager plateaux={plateaux} articlesVitre={articlesVitre} />
    </div>
  )
}
