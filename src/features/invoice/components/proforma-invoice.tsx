import type { ProformaInvoiceData } from '../types'
import { formatDate, formatMoney, getModeLabel } from '../lib/format'
import { PAIEMENT_LABELS } from '@/features/sell/types'
import { InvoicePrintSheet } from './invoice-print-sheet'

function InvoicePaper({
  invoice,
  version,
}: {
  invoice: ProformaInvoiceData
  version: 'client' | 'societe'
}) {
  const { company, vente } = invoice
  const { totals } = invoice

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
            {invoice.statut === 'brouillon' ? 'Pro forma' : 'Facture'}
          </p>
          <p className="text-xl font-bold">{invoice.numero}</p>
          <p className="text-[11px] text-slate-500">{formatDate(vente.date)}</p>
        </div>
      </header>

      <section className="invoice-parties mb-3 grid grid-cols-2 gap-2">
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

      {version === 'societe' && invoice.reglements.paiements.length > 0 && <div className="invoice-receipts mb-3 text-[11px] text-slate-600"><h4 className="font-medium">Règlements reçus</h4>{invoice.reglements.paiements.map(receipt => <p key={receipt.id}>{formatDate(receipt.date)} · {PAIEMENT_LABELS[receipt.mode]} · {formatMoney(receipt.montant)}</p>)}</div>}
      <div className="invoice-items overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[32rem] table-fixed text-left text-[11px]">
          <caption className="sr-only">Articles · {version === 'client' ? 'Exemplaire client' : 'Exemplaire société avec suivi des plateaux'}</caption>
          <colgroup>{(version === 'societe' ? [26, 12, 8, 13, 14, 15, 12] : [30, 13, 9, 16, 15, 17]).map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
          <thead className="bg-slate-100">
            <tr>
              <th className="px-2 py-2 font-semibold">Article</th>
              <th className="px-2 py-2 font-semibold">Mode</th>
              <th className="px-2 py-2 font-semibold">Qté</th>
              <th className="px-2 py-2 font-semibold">Dim.</th>
              <th className="px-2 py-2 font-semibold">PU</th>
              <th className="px-2 py-2 font-semibold text-right">Mt</th>
              {version === 'societe' && <th className="px-2 py-2 text-right font-semibold">Reste plateau (m²)</th>}
            </tr>
          </thead>
          <tbody>
            {vente.lignes.length === 0 ? (
              <tr>
                <td colSpan={version === 'societe' ? 7 : 6} className="px-2 py-5 text-center text-slate-500">
                  Aucune ligne de vente.
                </td>
              </tr>
            ) : (
              vente.lignes.map((ligne) => (
                <tr key={ligne.id} className="border-t border-slate-200 align-top">
                  <td className="px-2 py-2">
                    <div className="break-words font-medium">{ligne.articleDesignation}</div>
                    <div className="text-[10px] text-slate-500">{ligne.articleCode}</div>
                    {version === 'societe' && ligne.plateauId != null && <div className="text-[10px] text-slate-500">Plateau #{ligne.plateauId}</div>}
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
                  {version === 'societe' && <td className="px-2 py-2 text-right text-slate-600">
                    {ligne.plateauId != null && ligne.surfaceRestanteApres != null ? Number(ligne.surfaceRestanteApres).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                  </td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {version === 'societe' && vente.lignes.some(ligne => ligne.plateauId != null) && <p className="mt-2 text-[10px] text-slate-500">Reste plateau : surface enregistrée après chaque ligne de vente, en m².</p>}
      <div className="invoice-summary mt-4 flex justify-end">
        <div className="w-full max-w-xs space-y-1 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Sous-total</span>
            <span>{formatMoney(totals.sousTotalHt)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Remise {totals.modeRemise === 'pourcentage' ? `(${totals.valeurRemise} %)` : ''}</span>
            <span>− {formatMoney(totals.montantRemise)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Frais de livraison</span>
            <span>{formatMoney(totals.fraisLivraison)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Total HT</span>
            <span>{formatMoney(totals.totalHt)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
            <span>Net à payer</span>
            <span>{formatMoney(totals.totalTtc)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-600"><span>Total reçu</span><span>{formatMoney(invoice.reglements.montantPaye)}</span></div>
          <div className="flex items-center justify-between text-sm font-bold text-slate-900"><span>Reste à payer</span><span>{formatMoney(invoice.reglements.resteAPayer)}</span></div>
        </div>
      </div>

      <div className="invoice-signatures mt-3 grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-[9px] text-slate-600">
        <div className="px-1">
          <span className="block text-center font-medium uppercase tracking-[0.12em]">
            Caissier
          </span>
          <span className="mt-2 block h-10 border-b border-slate-300 text-center text-[11px] font-semibold normal-case tracking-normal">
            {invoice.caissierNom}
          </span>
        </div>
        <div className="px-1">
          <span className="block text-center font-medium uppercase tracking-[0.12em]">
            Client
          </span>
          <span className="mt-2 block h-10 border-b border-slate-300 text-center text-[11px] font-semibold normal-case tracking-normal">
            {vente.clientNom}
          </span>
        </div>
      </div>
    </div>
  )
}

export function ProformaInvoice({ invoice }: { invoice: ProformaInvoiceData }) {
  return (
    <InvoicePrintSheet>
      <div className="invoice-paper" data-invoice-version="client">
        <InvoicePaper invoice={invoice} version="client" />
      </div>
      <div className="invoice-paper" data-invoice-version="societe">
        <InvoicePaper invoice={invoice} version="societe" />
      </div>
    </InvoicePrintSheet>
  )
}
