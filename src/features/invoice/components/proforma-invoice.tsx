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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <header className="mb-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <img
              src="/logo.jpeg"
              alt="Logo VITALUXE"
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              {version === 'client' ? 'Version client' : 'Version société'}
            </p>
            <h3 className="text-2xl font-bold text-slate-900">{company.nom}</h3>
            <p className="text-sm text-slate-600">
              {company.adresse || 'Adresse non renseignée'}
            </p>
            <p className="text-sm text-slate-600">
              {company.telephone || 'Téléphone non renseigné'} ·
              {company.nif || 'NIF non renseigné'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Pro forma
          </p>
          <p className="text-2xl font-bold">{invoice.numero}</p>
          <p className="text-xs text-slate-500">Date : {formatDate(vente.date)}</p>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Client
          </p>
          <p className="mt-2 text-lg font-semibold">{vente.clientNom}</p>
          <p className="text-sm text-slate-600">
            {vente.clientTelephone || 'Téléphone non renseigné'}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Commercial
          </p>
          <p className="mt-2 text-lg font-semibold">{vente.commercialNom}</p>
          <p className="text-sm text-slate-600">
            Bon de vente N° {vente.numero}
          </p>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 font-semibold">Article</th>
              <th className="px-3 py-2 font-semibold">Mode</th>
              <th className="px-3 py-2 font-semibold">Qté</th>
              <th className="px-3 py-2 font-semibold">Dimensions</th>
              <th className="px-3 py-2 font-semibold">PU</th>
              <th className="px-3 py-2 font-semibold text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            {vente.lignes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  Aucune ligne de vente.
                </td>
              </tr>
            ) : (
              vente.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-t border-slate-200">
                  <td className="px-3 py-3">
                    <div className="font-medium">{ligne.articleDesignation}</div>
                    <div className="text-[11px] text-slate-500">
                      {ligne.articleCode}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {getModeLabel(ligne.mode)}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {ligne.quantiteFacturee}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {ligne.longueurM && ligne.hauteurM
                      ? `${ligne.longueurM} × ${ligne.hauteurM} m`
                      : '—'}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {formatMoney(ligne.prixApplique)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-slate-900">
                    {formatMoney(ligne.montant)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="w-full max-w-sm space-y-2 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Total HT</span>
            <span>{formatMoney(totals.totalHt)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>TVA (20%)</span>
            <span>{formatMoney(totals.montantTva)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
            <span>Total TTC</span>
            <span>{formatMoney(totals.totalTtc)}</span>
          </div>
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>STAT : {company.stat || '—'}</span>
          <span>
            Tolerance de mesure : {company.toleranceMesureM || '0.005'} m
          </span>
          <span>
            {version === 'client'
              ? 'Document de prévisionnel'
              : 'Document interne / société'}
          </span>
        </div>
      </footer>
    </div>
  )
}

export function ProformaInvoice({ invoice }: { invoice: ProformaInvoiceData }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <InvoicePaper invoice={invoice} version="client" />
      <InvoicePaper invoice={invoice} version="societe" />
    </div>
  )
}
