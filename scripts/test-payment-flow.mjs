// Exercise the actual server action against session-local PostgreSQL temporary tables.
// All business-table names are shadowed and verified before running mutations.
import 'dotenv/config'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

async function sourceUrl(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  let { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 } })
  for (const [specifier, url] of Object.entries(imports)) {
    outputText = outputText.replaceAll(`'${specifier}'`, JSON.stringify(url)).replaceAll(`"${specifier}"`, JSON.stringify(url))
  }
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
}
const inline = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000, query_timeout: 20000, statement_timeout: 20000 })
await client.connect()
try {
  for (const table of ['vente', 'facture', 'paiement']) {
    await client.query(`CREATE TEMP TABLE ${table} (LIKE public.${table} INCLUDING ALL)`)
    await client.query(`CREATE TEMP SEQUENCE fixture_${table}_id`)
    await client.query(`ALTER TABLE pg_temp.${table} ALTER COLUMN id SET DEFAULT nextval('pg_temp.fixture_${table}_id')`)
    await client.query(`ALTER SEQUENCE pg_temp.fixture_${table}_id OWNED BY pg_temp.${table}.id`)
    const guard = await client.query(`SELECT to_regclass('${table}') = 'pg_temp.${table}'::regclass AS isolated`)
    assert.equal(guard.rows[0].isolated, true)
  }
  await client.query('CREATE TEMP SEQUENCE fixture_invoice_number')
  await client.query("ALTER TABLE pg_temp.facture ALTER COLUMN numero SET DEFAULT 'TEST-' || nextval('pg_temp.fixture_invoice_number')")
  const schemaUrl = await sourceUrl('../src/db/schema.ts', { 'drizzle-orm': import.meta.resolve('drizzle-orm'), 'drizzle-orm/pg-core': import.meta.resolve('drizzle-orm/pg-core') })
  const schema = await import(schemaUrl)
  globalThis.__paymentFixtureDb = drizzle(client, { schema })
  const dbUrl = inline('export const db = globalThis.__paymentFixtureDb')
  const rulesUrl = await sourceUrl('../src/features/sell/lib/rules.ts')
  const tokenUrl = await sourceUrl('../src/features/invoice/lib/payment-token.ts', { '@/db': dbUrl, '@/features/sell/lib/rules': rulesUrl, 'drizzle-orm': import.meta.resolve('drizzle-orm'), jose: import.meta.resolve('jose') })
  const tokens = await import(tokenUrl)
  const actions = await import(await sourceUrl('../src/features/sell/action/vente.ts', {
    '@/db': dbUrl, '@/db/schema': schemaUrl, 'drizzle-orm': import.meta.resolve('drizzle-orm'),
    'next/cache': inline('export function revalidatePath() {}'),
    '@/features/auth/session': inline('export async function getSession() { return {id:7,role:"admin",nom:"Fixture"} }'),
    '@/features/invoice/models/invoice': await sourceUrl('../src/features/invoice/models/invoice.ts'),
    '../lib/rules': rulesUrl, '@/features/invoice/lib/payment-token': tokenUrl,
  }))
  await client.query("INSERT INTO pg_temp.vente (id,numero,client_id,commercial_id,total,statut) VALUES (42,1147,1,7,100,'confirmee'),(43,1148,1,7,100,'confirmee')")
  const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Indian/Antananarivo'}).format(new Date())
  const form = (extra = {}) => {
    const data = new FormData()
    for (const [name,value] of Object.entries({modeRemise:'pourcentage',valeurRemise:'10',fraisLivraison:'5',...extra})) data.set(name,value)
    return data
  }
  const receipt = async (id, amount, method='especes') => form({encaisser:'on',montantRecu:amount,modePaiement:method,datePaiement:today,paymentToken:await tokens.issuePaymentToken(id,7)})
  assert.equal((await actions.updateVenteOptions(42,{},form())).success,true)
  assert.equal((await client.query('SELECT count(*)::int AS n FROM pg_temp.paiement')).rows[0].n,0)
  const first = await receipt(42,'30')
  assert.equal((await actions.updateVenteOptions(42,{},first)).success,true)
  let invoice = (await client.query('SELECT * FROM pg_temp.facture WHERE vente_id=42')).rows[0]
  assert.equal(invoice.total_ttc,'95.00')
  assert.equal(invoice.statut,'partielle')
  assert.equal((await actions.updateVenteOptions(42,{},first)).success,true)
  assert.equal((await client.query('SELECT count(*)::int AS n FROM pg_temp.paiement')).rows[0].n,1)
  first.set('montantRecu','31')
  assert.ok((await actions.updateVenteOptions(42,{},first)).error)
  assert.ok((await actions.updateVenteOptions(42,{},await receipt(42,'80'))).error)
  assert.equal((await actions.updateVenteOptions(42,{},await receipt(42,'65','mobile_money'))).success,true)
  invoice = (await client.query('SELECT * FROM pg_temp.facture WHERE vente_id=42')).rows[0]
  assert.equal(invoice.statut,'payee')
  assert.equal((await client.query('SELECT sum(montant)::text AS total FROM pg_temp.paiement')).rows[0].total,'95.00')
  assert.ok((await actions.updateVenteOptions(42,{},await receipt(42,'0.01'))).error)
  assert.ok((await actions.updateVenteOptions(42,{},form({valeurRemise:'20'}))).error)
  assert.ok((await actions.updateVenteOptions(43,{},await receipt(43,'96'))).error)
  assert.equal((await client.query('SELECT count(*)::int AS n FROM pg_temp.facture WHERE vente_id=43')).rows[0].n,0)
  assert.equal((await client.query('SELECT valeur_remise FROM pg_temp.vente WHERE id=43')).rows[0].valeur_remise,'0.00')
  assert.equal((await client.query('SELECT count(*)::int AS n FROM pg_temp.paiement')).rows[0].n,2)
  console.log('Payment integration passed: real action, temporary tables only; partial/full receipts, replay, overpayment, locking and rollback verified.')
} finally {
  delete globalThis.__paymentFixtureDb
  await client.end() // PostgreSQL discards all temporary tables and their private sequences.
}
