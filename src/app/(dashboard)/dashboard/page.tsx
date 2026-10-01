import { getSession } from '@/features/auth/session'
import { logout } from '@/features/auth/action/auth'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const session = await getSession()

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-heading font-semibold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">
            Connecté en tant que <span className="font-medium">{session?.nom}</span>
            {' · '}
            <span className="capitalize">{session?.role}</span>
          </p>
        </div>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            Déconnexion
          </Button>
        </form>
      </div>
    </main>
  )
}
