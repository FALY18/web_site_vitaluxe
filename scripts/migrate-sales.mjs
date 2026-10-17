import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 })
const connection = await pool.connect()
try {
  await connection.query('BEGIN')
  await connection.query("SET LOCAL lock_timeout = '5s'")
  await connection.query(await readFile(new URL('../drizzle/006_annulation_lignes.sql', import.meta.url), 'utf8'))
  await connection.query('COMMIT')
  console.log('Migration 006 applied: ligne_vente.annulee is available; existing rows are preserved.')
} catch (error) {
  await connection.query('ROLLBACK')
  throw error
} finally {
  connection.release()
  await pool.end()
}
