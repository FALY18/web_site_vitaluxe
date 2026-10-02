import { getSession } from '@/features/auth/session'
import { NouvelleVenteForm } from '@/features/sell/components/nouvelle-vente-form'
import { PageHeader } from '@/features/dashboard/components/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function NouvelleVentePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="p-6 flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/ventes">
          <Button variant="ghost" size="icon-sm"><ArrowLeft className="size-4" /></Button>
        </Link>
        <PageHeader title="Nouvelle vente" description="Étape 1 — Informations client" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Client</CardTitle>
          <CardDescription>
            Si le client existe déjà, il sera retrouvé automatiquement par son nom.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NouvelleVenteForm />
        </CardContent>
      </Card>
    </div>
  )
}
