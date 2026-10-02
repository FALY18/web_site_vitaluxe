import { db } from '@/db'
import { utilisateur } from '@/db/schema'
import { getSession } from '@/features/auth/session'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { UtilisateurTable } from '@/features/utilisateur/components/utilisateur-table'
import { CreateUtilisateurForm } from '@/features/utilisateur/components/create-utilisateur-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UtilisateursPage() {
  const session = await getSession()
  if (session?.role !== 'admin') redirect('/dashboard')

  const users = await db
    .select({ id: utilisateur.id, nom: utilisateur.nom, identifiant: utilisateur.identifiant, role: utilisateur.role })
    .from(utilisateur)
    .orderBy(utilisateur.nom)

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Utilisateurs"
        description={`${users.length} compte${users.length > 1 ? 's' : ''} enregistré${users.length > 1 ? 's' : ''}`}
      />

      <UtilisateurTable users={users} currentUserId={session.id} />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Créer un utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUtilisateurForm />
        </CardContent>
      </Card>
    </div>
  )
}
