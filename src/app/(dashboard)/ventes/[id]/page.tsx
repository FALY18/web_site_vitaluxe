import { getSession } from '@/features/auth/session'
import { getVenteById, getPlateauxDisponibles } from '@/features/sell/queries/vente'
import { getArticles } from '@/features/article/queries/article'
import { getProformaInvoiceData, getFactureByVenteId } from '@/features/invoice/queries/invoice'
import { createProformaInvoice, createFinalInvoice } from '@/features/invoice/action/invoice'
import { VenteDetailView } from '@/features/sell/components/vente-detail'
import { VenteOptionsForm } from '@/features/sell/components/vente-options-form'
import { VenteWorkspace } from '@/features/sell/components/vente-workspace'
import { SaleActionForm } from '@/features/sell/components/sale-action-form'
import { ProformaInvoice } from '@/features/invoice/components/proforma-invoice'
import { InvoicePrintButton } from '@/features/invoice/components/invoice-print-button'
import { LigneForm } from '@/features/sell/components/ligne-form'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export default async function VenteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!['admin', 'commercial'].includes(session.role)) redirect('/dashboard')
  const { id } = await params
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1 || Number(id) > 2147483647) notFound()
  const venteData = await getVenteById(Number(id))
  if (!venteData) notFound()
  const isBrouillon = venteData.statut === 'brouillon'
  const canInvoice = ['confirmee', 'livree'].includes(venteData.statut)
  const [articles, plateaux, invoiceData, factureData] = await Promise.all([
    isBrouillon ? getArticles() : Promise.resolve([]),
    isBrouillon ? getPlateauxDisponibles() : Promise.resolve([]),
    canInvoice ? getProformaInvoiceData(Number(id)) : Promise.resolve(null),
    canInvoice ? getFactureByVenteId(Number(id)) : Promise.resolve(null),
  ])
  const locked = Boolean(factureData && factureData.statut !== 'brouillon')
  const invoice = canInvoice ? (
    <div className="grid gap-5">
      <VenteOptionsForm vente={venteData} locked={locked} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Facture</h2>
        <div className="flex flex-wrap items-start gap-2">
          {!locked && <>
            <SaleActionForm action={createProformaInvoice.bind(null, venteData.id)}>
              <Button type="submit" variant="outline">{factureData ? 'Actualiser la pro forma' : 'Enregistrer la pro forma'}</Button>
            </SaleActionForm>
            <SaleActionForm action={createFinalInvoice.bind(null, venteData.id)} confirmMessage="Émettre la facture finale ? Les montants seront verrouillés.">
              <Button type="submit">Émettre la facture finale</Button>
            </SaleActionForm>
          </>}
          {invoiceData && <InvoicePrintButton />}
        </div>
      </div>
      {factureData && <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">Facture {factureData.numero} · {factureData.statut === 'brouillon' ? 'Pro forma' : 'Émise / verrouillée'}</p>}
      {invoiceData ? <ProformaInvoice invoice={invoiceData} /> : <p role="status" className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">Renseignez les informations de la société avant de prévisualiser la facture.</p>}
    </div>
  ) : undefined

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title={`Bon de vente #${venteData.numero}`} description={`${venteData.clientNom} · ${new Date(venteData.date).toLocaleDateString('fr-FR')}`} action={<Link href="/ventes" className="inline-flex min-h-10 items-center rounded-lg border border-border bg-card px-4 text-sm">Retour aux ventes</Link>} />
      <VenteWorkspace count={venteData.lignes.length} entry={isBrouillon ? <LigneForm venteId={venteData.id} articles={articles} plateaux={plateaux} /> : undefined} detail={<VenteDetailView vente={venteData} />} invoice={invoice} />
    </div>
  )
}
