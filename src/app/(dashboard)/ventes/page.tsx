import { getSession } from '@/features/auth/session'
import { getVentes } from '@/features/sell/queries/vente'
import { VenteTable } from '@/features/sell/components/vente-table'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function VentesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const ventes = await getVentes()

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Ventes"
        description={`${ventes.length} bon${ventes.length > 1 ? 's' : ''} de vente`}
        action={
          <Link href="/dashboard/ventes/nouveau">
            <Button size="sm"><Plus className="size-4" />Nouvelle vente</Button>
          </Link>
        }
      />
      <VenteTable ventes={ventes} />
    </div>
  )
}
