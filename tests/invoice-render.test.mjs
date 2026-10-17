import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

async function sourceUrl(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  let { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } })
  for (const [specifier, url] of Object.entries(imports)) {
    outputText = outputText.replaceAll(`'${specifier}'`, JSON.stringify(url)).replaceAll(`"${specifier}"`, JSON.stringify(url))
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}
const { ProformaInvoice } = await import(await sourceUrl('../src/features/invoice/components/proforma-invoice.tsx', {
  'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
  '../lib/format': await sourceUrl('../src/features/invoice/lib/format.ts'),
  '@/features/sell/types': await sourceUrl('../src/features/sell/types/index.ts'),
  './invoice-print-sheet': await sourceUrl('../src/features/invoice/components/invoice-print-sheet.tsx', {
    'react/jsx-runtime': import.meta.resolve('react/jsx-runtime'),
    react: import.meta.resolve('react'),
    '../lib/print-fit': await sourceUrl('../src/features/invoice/lib/print-fit.ts'),
  }),
}))
const fixture = {
  numero: 'FAC-TEST', statut: 'payee', caissierNom: 'Caissier test',
  company: { nom: 'Société test', adresse: 'Adresse', telephone: '000', nif: 'NIF', stat: 'STAT', toleranceMesureM: '0.005' },
  reglements: { paiements: [{ id: 1, date: '2026-10-17', montant: '150000.00', mode: 'mobile_money' }, { id: 2, date: '2026-10-17', montant: '88240.00', mode: 'especes' }], montantPaye: 238240, resteAPayer: 0 },
  totals: { sousTotalHt: 238240, modeRemise: 'montant', valeurRemise: 0, montantRemise: 0, fraisLivraison: 0, totalHt: 238240, montantTva: 0, totalTtc: 238240 },
  vente: { id: 1, numero: 1147, date: '2026-10-17', statut: 'confirmee', total: '238240.00', modeRemise: 'montant', valeurRemise: '0', fraisLivraison: '0', clientNom: 'Client test', clientTelephone: '000', commercialNom: 'Commercial test', lignes: Array.from({ length: 50 }, (_, index) => ({ id: index + 1, venteId: 1, articleId: 1, articleCode: 'VIT-TEST', articleDesignation: `Article-test-${String(index + 1).padStart(3, '0')}`, plateauId: index === 49 ? null : 7, mode: index === 49 ? 'standard' : 'decoupe', nombre: 1, longueurM: '1.000', hauteurM: '0.100', quantiteFacturee: '0.10', prixApplique: '100.00', montant: '10.00', surfaceRestanteApres: index === 49 ? null : '4.25', surfaceRestanteActuelleM2: '1.99' })) },
}
const html = renderToStaticMarkup(createElement(ProformaInvoice, { invoice: fixture }))
const clientStart = html.indexOf('data-invoice-version="client"')
const companyStart = html.indexOf('data-invoice-version="societe"')
const clientCopy = html.slice(clientStart, companyStart)
const companyCopy = html.slice(companyStart)

const { fitInvoiceToPage } = await import(await sourceUrl('../src/features/invoice/lib/print-fit.ts'))
test('printing scales tall invoices to fit the single available sheet', () => {
  for (const height of [400, 1200, 6000]) {
    let zoom = 1
    const content = { style: { setProperty: (_name, value) => { zoom = Number(value) } }, getBoundingClientRect: () => ({ width: 1062 * zoom, height: height * zoom }) }
    fitInvoiceToPage({ querySelector: () => content, clientHeight: 729, clientWidth: 1062 })
    assert.ok(height * zoom <= 729)
    assert.ok(1062 * zoom <= 1062)
    assert.ok(zoom > 0 && zoom <= 1)
  }
})

test('receipt details are present only in the company invoice', () => {
  assert.doesNotMatch(clientCopy, /Règlements reçus|Mobile money|Espèces/)
  assert.match(companyCopy, /Règlements reçus/)
  assert.match(companyCopy, /Mobile money/)
  assert.match(companyCopy, /Espèces/)
  assert.match(clientCopy, /Total reçu/)
  assert.match(clientCopy, /Reste à payer/)
})
test('plateau balances use each transaction snapshot and remain internal', () => {
  assert.doesNotMatch(clientCopy, /Reste plateau|Plateau #7|4,25/)
  assert.match(companyCopy, /Reste plateau/)
  assert.equal((companyCopy.match(/4,25/g) ?? []).length, 49)
  assert.doesNotMatch(companyCopy, /1,99/)
})
test('both invoice copies render all 50 articles without a row limit', () => {
  for (const copy of [clientCopy, companyCopy]) {
    for (let row = 1; row <= 50; row++) assert.ok(copy.includes(`Article-test-${String(row).padStart(3, '0')}`))
  }
})
