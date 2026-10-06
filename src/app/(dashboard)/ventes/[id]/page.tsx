import { getSession } from '@/features/auth/session'
import { getVenteById, getPlateauxDisponibles } from '@/features/sell/queries/vente'
import { getArticles } from '@/features/article/queries/article'
import { getProformaInvoiceData, getFactureByVenteId } from '@/features/invoice/queries/invoice'
import { createProformaInvoice } from '@/features/invoice/action/invoice'
import { VenteDetailView } from '@/features/sell/components/vente-detail'
import { ProformaInvoice } from '@/features/invoice/components/proforma-invoice'
import { InvoicePrintButton } from '@/features/invoice/components/invoice-print-button'
import { createFinalInvoice } from '@/features/invoice/action/invoice'
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
  const [venteData, articles, plateaux, invoiceData, factureData] = await Promise.all([
    getVenteById(Number(id)),
    getArticles(),
    getPlateauxDisponibles(),
    getProformaInvoiceData(Number(id)),
    getFactureByVenteId(Number(id)),
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

      {invoiceData && ['confirmee', 'livree'].includes(venteData.statut) && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Aperçu facture pro forma</h2>
            <div className="flex items-center gap-2">
              <form action={createProformaInvoice.bind(null, venteData.id)}>
                <Button type="submit" size="sm" variant={factureData ? 'secondary' : 'default'}>
                  {factureData ? 'Rafraîchir' : 'Générer'}
                </Button>
              </form>
              <form action={createFinalInvoice.bind(null, venteData.id)}>
                <Button type="submit" size="sm" variant={factureData?.statut === 'emise' ? 'secondary' : 'outline'}>
                  {factureData?.statut === 'emise' ? 'Facture finale' : 'Créer facture finale'}
                </Button>
              </form>
              <InvoicePrintButton />
            </div>
          </div>
          {factureData && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
              {factureData.statut === 'emise'
                ? <>Facture finale enregistrée : <span className="font-semibold">{factureData.numero || 'N° en cours'}</span></>
                : <>Facture enregistrée : <span className="font-semibold">{factureData.numero || 'N° en cours'}</span></>}
            </div>
          )}
          <ProformaInvoice invoice={invoiceData} />
        </div>
      )}

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
