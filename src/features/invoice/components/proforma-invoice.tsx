import type { ProformaInvoiceData } from '../types'
import { calculateInvoiceTotals } from '../models/invoice'
import { formatDate, formatMoney, getModeLabel } from '../lib/format'

function InvoicePaper({
  invoice,
  version,
}: {
  invoice: ProformaInvoiceData
  version: 'client' | 'societe'
}) {
  const { company, vente } = invoice
  const totals = calculateInvoiceTotals(vente.total ?? 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm sm:p-5">
      <header className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img
              src="/logo.jpeg"
              alt="Logo VITALUXE"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
              {version === 'client' ? 'Version client' : 'Version société'}
            </p>
            <h3 className="text-lg font-bold text-slate-900">{company.nom}</h3>
            <p className="text-[11px] text-slate-600">
              {company.adresse || 'Adresse non renseignée'}
            </p>
            <p className="text-[11px] text-slate-600">
              {company.telephone || 'Téléphone non renseigné'} ·
              {company.nif || 'NIF non renseigné'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
            Pro forma
          </p>
          <p className="text-xl font-bold">{invoice.numero}</p>
          <p className="text-[11px] text-slate-500">{formatDate(vente.date)}</p>
        </div>
      </header>

      <section className="mb-3 grid grid-cols-2 gap-2">
        <div className="min-w-0 rounded-lg bg-slate-50 p-2">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Client</p>
          <p className="mt-1 truncate text-sm font-semibold">{vente.clientNom}</p>
          <p className="truncate text-[11px] text-slate-600">
            {vente.clientTelephone || 'Téléphone non renseigné'}
          </p>
        </div>

        <div className="min-w-0 rounded-lg bg-slate-50 p-2">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">Commercial</p>
          <p className="mt-1 truncate text-sm font-semibold">{vente.commercialNom}</p>
          <p className="truncate text-[11px] text-slate-600">Bon N° {vente.numero}</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-2 py-2 font-semibold">Article</th>
              <th className="px-2 py-2 font-semibold">Mode</th>
              <th className="px-2 py-2 font-semibold">Qté</th>
              <th className="px-2 py-2 font-semibold">Dim.</th>
              <th className="px-2 py-2 font-semibold">PU</th>
              <th className="px-2 py-2 font-semibold text-right">Mt</th>
            </tr>
          </thead>
          <tbody>
            {vente.lignes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-5 text-center text-slate-500">
                  Aucune ligne de vente.
                </td>
              </tr>
            ) : (
              vente.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-t border-slate-200 align-top">
                  <td className="px-2 py-2">
                    <div className="font-medium">{ligne.articleDesignation}</div>
                    <div className="text-[10px] text-slate-500">{ligne.articleCode}</div>
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    {getModeLabel(ligne.mode)}
                  </td>
                  <td className="px-2 py-2 text-slate-600">{ligne.quantiteFacturee}</td>
                  <td className="px-2 py-2 text-slate-600">
                    {ligne.longueurM && ligne.hauteurM
                      ? `${ligne.longueurM}×${ligne.hauteurM}`
                      : '—'}
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    {formatMoney(ligne.prixApplique)}
                  </td>
                  <td className="px-2 py-2 text-right font-semibold text-slate-900">
                    {formatMoney(ligne.montant)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-full max-w-xs space-y-1 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Total HT</span>
            <span>{formatMoney(totals.totalHt)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>TVA (20%)</span>
            <span>{formatMoney(totals.montantTva)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
            <span>Total TTC</span>
            <span>{formatMoney(totals.totalTtc)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-[9px] text-slate-600">
        <div className="px-1">
          <span className="block text-center font-medium uppercase tracking-[0.12em]">
            Cachet de l'entreprise
          </span>
          <span className="mt-2 block h-10 border-b border-slate-300" />
        </div>
        <div className="px-1">
          <span className="block text-center font-medium uppercase tracking-[0.12em]">
            Signature du client
          </span>
          <span className="mt-2 block h-10 border-b border-slate-300" />
        </div>
      </div>
    </div>
  )
}

export function ProformaInvoice({ invoice }: { invoice: ProformaInvoiceData }) {
  return (
    <div className="invoice-template invoice-premium grid gap-5 xl:grid-cols-2 print:gap-3">
      <div className="invoice-paper">
        <InvoicePaper invoice={invoice} version="client" />
      </div>
      <div className="invoice-paper">
        <InvoicePaper invoice={invoice} version="societe" />
      </div>
    </div>
  )
}
