import { PageHeader } from '@/features/dashboard/components/page-header'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ArticlesPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Articles"
        description="Catalogue des produits"
        action={<Button size="sm"><Plus className="size-4" />Nouvel article</Button>}
      />
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-8 text-center text-sm text-muted-foreground">
        Module articles — en cours de développement
      </div>
    </div>
  )
}
