import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

async function loadSource(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 } })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}
const rules = await loadSource('../src/features/sell/lib/rules.ts')
const { calculateInvoiceTotals } = await loadSource('../src/features/invoice/models/invoice.ts')

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
