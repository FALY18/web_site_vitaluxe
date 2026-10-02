import { getSession } from '@/features/auth/session'
import { StatCard } from '@/features/dashboard/components/stat-card'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { db } from '@/db'
import { vente, article, utilisateur, client } from '@/db/schema'
import { count, eq } from 'drizzle-orm'

export default async function DashboardPage() {
  const session = await getSession()

  const [[{ total: totalVentes }], [{ total: totalArticles }], [{ total: totalClients }], [{ total: totalUsers }]] =
    await Promise.all([
      db.select({ total: count() }).from(vente),
      db.select({ total: count() }).from(article),
      db.select({ total: count() }).from(client),
      db.select({ total: count() }).from(utilisateur),
    ])

  return (
    <div className="p-6">
      <PageHeader
        title={`Bonjour, ${session?.nom}`}
        description="Vue d'ensemble de l'activité VITALUXE"
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Ventes totales" value={totalVentes} sub="Toutes périodes" trend="neutral" />
        <StatCard label="Articles catalogue" value={totalArticles} sub="Actifs" trend="neutral" />
        <StatCard label="Clients" value={totalClients} sub="Enregistrés" trend="neutral" />
        <StatCard label="Utilisateurs" value={totalUsers} sub="Comptes actifs" trend="neutral" />
      </div>
    </div>
  )
}
