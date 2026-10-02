import { getSession } from '@/features/auth/session'
import { getVenteById, getPlateauxDisponibles } from '@/features/sell/queries/vente'
import { getArticles } from '@/features/article/queries/article'
import { VenteDetailView } from '@/features/sell/components/vente-detail'
import { LigneForm } from '@/features/sell/components/ligne-form'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export default async function VenteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const [venteData, articles, plateaux] = await Promise.all([
    getVenteById(Number(id)),
    getArticles(),
    getPlateauxDisponibles(),
  ])

  if (!venteData) notFound()

  const isBrouillon = venteData.statut === 'brouillon'

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/ventes">
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="size-4" /></Button>
        </Link>
        <PageHeader
          title={`Bon de vente #${venteData.numero}`}
          description={`${venteData.clientNom} · ${new Date(venteData.date).toLocaleDateString('fr-FR')}`}
        />
      </div>

      <VenteDetailView vente={venteData} />

      {isBrouillon && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ajouter une ligne</CardTitle>
          </CardHeader>
          <CardContent>
            <LigneForm venteId={venteData.id} articles={articles} plateaux={plateaux} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
