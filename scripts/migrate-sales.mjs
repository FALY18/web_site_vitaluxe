import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 })
const connection = await pool.connect()
try {
  await connection.query('BEGIN')
  await connection.query("SET LOCAL lock_timeout = '5s'")
  const before = await connection.query('SELECT count(*)::int AS count FROM paiement')
  await connection.query(await readFile(new URL('../drizzle/006_annulation_lignes.sql', import.meta.url), 'utf8'))
  await connection.query(await readFile(new URL('../drizzle/008_remove_planned_payment.sql', import.meta.url), 'utf8'))
  const after = await connection.query('SELECT count(*)::int AS count FROM paiement')
  if (before.rows[0].count !== after.rows[0].count) throw new Error('Receipt count changed unexpectedly; migration rolled back.')
  await connection.query('COMMIT')
  console.log('Migrations 006 and 008 applied: planned-method columns removed; actual receipts preserved.')
  console.log(`Actual receipts preserved: ${after.rows[0].count}`)
} catch (error) {
  await connection.query('ROLLBACK')
  throw error
} finally {
  connection.release()
  await pool.end()
}
