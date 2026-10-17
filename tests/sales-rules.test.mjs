import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

async function moduleUrl(path, replacements = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 } })
  let code = outputText
  for (const [specifier, replacement] of Object.entries(replacements)) code = code.replaceAll(specifier, replacement)
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
}
async function loadSource(path) { return import(await moduleUrl(path)) }
const rules = await loadSource('../src/features/sell/lib/rules.ts')
const { calculateInvoiceTotals } = await loadSource('../src/features/invoice/models/invoice.ts')

test('receipt tokens bind the existing payment ID to the sale and authenticated user', async () => {
  const fakeDb = `data:text/javascript;base64,${Buffer.from('export const db = { execute: async () => ({ rows: [{id: 17}] }) }').toString('base64')}`
  const paymentTokens = await import(await moduleUrl('../src/features/invoice/lib/payment-token.ts', {
    '@/db': fakeDb,
    '@/features/sell/lib/rules': await moduleUrl('../src/features/sell/lib/rules.ts'),
    'jose': import.meta.resolve('jose'),
    'drizzle-orm': import.meta.resolve('drizzle-orm'),
  }))
  const token = await paymentTokens.issuePaymentToken(42, 7)
  assert.equal(await paymentTokens.verifyPaymentToken(token, 42, 7), 17)
  assert.equal(await paymentTokens.verifyPaymentToken(token, 42, 7), 17) // A retry targets the same primary key.
  await assert.rejects(paymentTokens.verifyPaymentToken(token, 43, 7))
  await assert.rejects(paymentTokens.verifyPaymentToken(token, 42, 8))
  await assert.rejects(paymentTokens.verifyPaymentToken(`${token}tampered`, 42, 7))
  await assert.rejects(paymentTokens.verifyPaymentToken(null, 42, 7))
})

test('partial and final receipts update the balance and invoice status', () => {
  assert.deepEqual(rules.paymentOutcome('100000.00', '0.00', '30000.00'), { montantPaye: '30000.00', resteAPayer: '70000.00', statut: 'partielle' })
  assert.deepEqual(rules.paymentOutcome('100000.00', '30000.00', '70000.00'), { montantPaye: '100000.00', resteAPayer: '0.00', statut: 'payee' })
})
test('receipt calculations preserve cents exactly and accept zero-total invoices', () => {
  assert.deepEqual(rules.paymentOutcome('0.30', '0.10', '0.20'), { montantPaye: '0.30', resteAPayer: '0.00', statut: 'payee' })
  assert.deepEqual(rules.paymentBalance('0.00', '0.00'), { montantPaye: 0, resteAPayer: 0 })
})
test('receipts cannot be zero, negative, overpaid or exceed a settled invoice', () => {
  for (const amount of ['0', '-1', 'NaN', '0.001', '70.01']) assert.throws(() => rules.paymentOutcome('100.00', '30.00', amount))
  assert.throws(() => rules.paymentOutcome('100.00', '100.00', '0.01'))
  assert.throws(() => rules.paymentBalance('100.00', '100.01'))
})
test('actual receipt dates must exist and cannot be in the future', () => {
  assert.equal(rules.validPaymentDate('2024-02-29'), '2024-02-29')
  for (const date of ['2025-02-29', '2024-13-01', '', null, '9999-01-01']) assert.throws(() => rules.validPaymentDate(date))
})

test('successive cuts subtract from current remaining surface, not original dimensions', () => {
  const afterFirst = rules.surfaceAfterSale('6.50', rules.cutQuantity(1.2, 0.8, 2))
  const afterSecond = rules.surfaceAfterSale(afterFirst, rules.cutQuantity(1.2, 0.8, 1))
  assert.equal(afterFirst, '4.58')
  assert.equal(afterSecond, '3.62')
})
test('restoring an older cut preserves subsequent transactions', () => {
  assert.equal(rules.surfaceAfterRestoration('3.62', 1.92), '5.54')
  assert.equal(rules.surfaceAfterRestoration('0.00', 0.96), '0.96')
})
test('whole-sheet sale and exact exhaustion leave zero without floating point residue', () => {
  assert.equal(rules.surfaceAfterSale('6.50', 6.5), '0.00')
  assert.equal(rules.surfaceAfterSale('0.30', 0.1), '0.20')
  assert.equal(rules.surfaceAfterSale('0.20', 0.2), '0.00')
})
test('insufficient, zero or nonfinite sheet debits are rejected', () => {
  for (const sold of [0, -1, NaN, Infinity, 3.51, 0.001]) assert.throws(() => rules.surfaceAfterSale('3.50', sold))
  assert.throws(() => rules.surfaceAfterRestoration('99999999.99', 1))
})
test('only the existing PostgreSQL payment enum values are accepted', () => {
  for (const method of ['especes', 'mobile_money', 'virement', 'cheque']) assert.equal(rules.paymentMethod(method), method)
  for (const method of ['', null, undefined, 'carte', 'toString', 'ESPECES']) assert.throws(() => rules.paymentMethod(method))
})

test('article types expose only their supported sale modes', () => {
  assert.deepEqual(rules.modesForArticle('vitre'), ['decoupe', 'plateau_entier'])
  assert.deepEqual(rules.modesForArticle('vitre', true), ['decoupe', 'plateau_entier', 'plateau_gros'])
  assert.deepEqual(rules.modesForArticle('alu'), ['barre', 'pack'])
  assert.deepEqual(rules.modesForArticle('accessoire'), ['standard'])
  assert.deepEqual(rules.modesForArticle('service'), ['standard'])
})
test('invalid IDs, counts and numeric payloads are rejected', () => {
  for (const n of [0, -1, 1.5, NaN, Infinity, 2147483648]) assert.throws(() => rules.positiveInteger(n, 'Nombre'))
  for (const n of ['', '-1', 'NaN', 'Infinity', '1e3', '0.001', '1000000000000']) assert.throws(() => rules.decimal(n, 'Prix'))
  for (const n of ['0', '-2', '1.0001', '1000', 'NaN']) assert.throws(() => rules.dimension(n, 'Longueur'))
  assert.equal(rules.decimal('0.00', 'Prix'), 0)
  assert.equal(rules.dimension('0.001', 'Longueur'), 0.001)
})
test('cut quantity and amount share the persisted two-decimal precision', () => {
  const quantity = rules.cutQuantity(1.005, 1, 1)
  assert.equal(quantity, 1.01)
  assert.deepEqual(rules.lineAmounts(quantity, '100.00'), { quantiteFacturee: '1.01', montant: '101.00' })
  assert.equal(rules.cutQuantity(0.335, 1, 3), 1.01)
  assert.deepEqual(rules.lineAmounts(rules.cutQuantity(1.2, 0.8, 3), '45000.00'), { quantiteFacturee: '2.88', montant: '129600.00' })
})
test('zero, tiny, overflowing and nonfinite quantities cannot create a line', () => {
  for (const q of [0, -1, 0.001, NaN, Infinity, 100000000]) assert.throws(() => rules.lineAmounts(q, '100.00'))
  assert.throws(() => rules.lineAmounts(99999999, '999999999999.99'))
  assert.deepEqual(rules.lineAmounts(3, '0.00'), { quantiteFacturee: '3.00', montant: '0.00' })
})
test('pack price bills packs while the stock conversion is in bars', () => {
  assert.deepEqual(rules.lineAmounts(2, '60000.00'), { quantiteFacturee: '2.00', montant: '120000.00' })
})
test('cut fit accepts rotation and measurement tolerance, rejects oversized cuts', () => {
  assert.equal(rules.cutFits(2, 3, 3, 2, 0), true)
  assert.equal(rules.cutFits(3.004, 2, 3, 2, 0.005), true)
  assert.equal(rules.cutFits(3.006, 2, 3, 2, 0.005), false)
})
test('sale transitions are forward-only and terminal states stay terminal', () => {
  assert.equal(rules.canTransition('brouillon', 'confirmee'), true)
  assert.equal(rules.canTransition('confirmee', 'livree'), true)
  assert.equal(rules.canTransition('brouillon', 'annulee'), true)
  assert.equal(rules.canTransition('confirmee', 'annulee'), true)
  for (const [from, to] of [['brouillon', 'livree'], ['confirmee', 'brouillon'], ['livree', 'annulee'], ['annulee', 'confirmee']]) assert.equal(rules.canTransition(from, to), false)
})
test('discount applies to articles before delivery and uses monetary rounding', () => {
  const totals = calculateInvoiceTotals('100000.00', 'pourcentage', '10', '5000')
  assert.equal(totals.montantRemise, 10000)
  assert.equal(totals.totalTtc, 95000)
  assert.equal(calculateInvoiceTotals(1000, 'montant', 1000, 500).totalTtc, 500)
  assert.equal(calculateInvoiceTotals(1000, 'pourcentage', 100, 0).totalTtc, 0)
  assert.equal(calculateInvoiceTotals('99.99', 'pourcentage', '12.5', '0').montantRemise, 12.5)
})
