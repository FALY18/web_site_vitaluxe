import { getClients } from '@/features/client/queries/client'
import { ClientManager } from '@/features/client/components/client-manager'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { getSession } from '@/features/auth/session'
import { redirect } from 'next/navigation'

export default async function ClientsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const clients = await getClients()

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length > 1 ? 's' : ''} enregistré${clients.length > 1 ? 's' : ''}`}
      />
      <ClientManager clients={clients} />
    </div>
  )
}
