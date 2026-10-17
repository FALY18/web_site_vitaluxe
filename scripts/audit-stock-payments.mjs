import 'dotenv/config'
import pg from 'pg'
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000, query_timeout: 15000 })
const c = await pool.connect()
try {
  await c.query('BEGIN READ ONLY')
  const { rows: columns } = await c.query("SELECT table_name, column_name, data_type, udt_name, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('plateau','ligne_vente','mouvement_stock','paiement','vente','facture') ORDER BY table_name, ordinal_position")
  const { rows: modes } = await c.query("SELECT enumlabel FROM pg_enum WHERE enumtypid='mode_paiement'::regtype ORDER BY enumsortorder")
  const { rows: issues } = await c.query(`
    SELECT 'plateau_vs_latest_movement' issue, count(*)::int count FROM plateau p JOIN LATERAL (SELECT stock_apres FROM mouvement_stock m WHERE m.plateau_id=p.id ORDER BY date_heure DESC,id DESC LIMIT 1) m ON true WHERE p.surface_restante_m2<>m.stock_apres
    UNION ALL SELECT 'surface_above_original',count(*)::int FROM plateau WHERE surface_restante_m2>round(longueur_origine_m*hauteur_origine_m,2)
    UNION ALL SELECT 'empty_available_plateau',count(*)::int FROM plateau WHERE surface_restante_m2=0 AND statut='disponible'
    UNION ALL SELECT 'nonempty_sold_plateau',count(*)::int FROM plateau WHERE surface_restante_m2>0 AND statut IN ('epuise','vendu_entier')
    UNION ALL SELECT 'sale_line_vs_stock_snapshot',count(*)::int FROM ligne_vente l JOIN mouvement_stock m ON m.ligne_vente_id=l.id AND m.type='vente' WHERE l.plateau_id IS NOT NULL AND l.surface_restante_apres IS DISTINCT FROM m.stock_apres
  `)
  const plannedMethodColumnsRemoved = ['vente', 'facture'].every(table => !columns.some(column => column.table_name === table && column.column_name === 'mode_paiement'))
  const actualReceiptSchemaPreserved = ['facture_id', 'date', 'montant', 'mode'].every(name => columns.some(column => column.table_name === 'paiement' && column.column_name === name))
  console.log(JSON.stringify({ plannedMethodColumnsRemoved, actualReceiptSchemaPreserved, columns, paymentModes: modes.map(m=>m.enumlabel), issues },null,2))
  await c.query('ROLLBACK')
} finally { c.release(); await pool.end() }
