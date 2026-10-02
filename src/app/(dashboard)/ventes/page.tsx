import { PageHeader } from '@/features/dashboard/components/page-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function VentesPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Ventes"
        description="Gestion des bons de vente"
        action={<Button size="sm"><Plus className="size-4" />Nouvelle vente</Button>}
      />
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-8 text-center text-sm text-muted-foreground">
        Module ventes — en cours de développement
      </div>
    </div>
  )
}
