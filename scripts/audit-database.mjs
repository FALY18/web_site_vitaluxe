import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000, query_timeout: 15000 })
const connection = await pool.connect()
try {
  await connection.query('BEGIN READ ONLY')
  const { rows: columns } = await connection.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ('ligne_vente', 'vente', 'facture')")
  const hasCancelled = columns.some(c => c.table_name === 'ligne_vente' && c.column_name === 'annulee')
  const active = hasCancelled ? 'AND NOT l.annulee' : ''
  const { rows: checks } = await connection.query("SELECT conrelid::regclass::text AS table_name, conname AS name, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND contype IN ('c','f') ORDER BY conrelid::regclass::text, conname")
  const { rows: triggers } = await connection.query("SELECT c.relname AS table_name, t.tgname AS name, t.tgenabled AS enabled FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal ORDER BY c.relname, t.tgname")
  const { rows: issues } = await connection.query(`
    SELECT 'sale_total_mismatch' AS issue, count(*)::int AS count FROM vente v WHERE v.total <> (SELECT COALESCE(sum(l.montant),0) FROM ligne_vente l WHERE l.vente_id=v.id ${active})
    UNION ALL SELECT 'duplicate_invoices', count(*)::int FROM (SELECT vente_id FROM facture GROUP BY vente_id HAVING count(*) > 1) d
    UNION ALL SELECT 'plateau_article_mismatch', count(*)::int FROM ligne_vente l JOIN plateau p ON p.id=l.plateau_id WHERE p.article_id<>l.article_id ${active}
    UNION ALL SELECT 'incompatible_modes', count(*)::int FROM ligne_vente l JOIN article a ON a.id=l.article_id WHERE NOT ((a.type='vitre' AND l.mode IN ('decoupe','plateau_entier','plateau_gros')) OR (a.type='alu' AND l.mode IN ('barre','pack')) OR (a.type IN ('accessoire','service') AND l.mode='standard')) ${active}
  `)
  console.log(JSON.stringify({ migration006Applied: hasCancelled, constraints: checks, triggers, issues }, null, 2))
  await connection.query('ROLLBACK')
} finally {
  connection.release()
  await pool.end()
}
