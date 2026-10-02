import { PageHeader } from '@/features/dashboard/components/page-header'

export default function StockPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Stock"
        description="Gestion des plateaux et mouvements de stock"
      />
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 p-8 text-center text-sm text-muted-foreground">
        Module stock — en cours de développement
      </div>
    </div>
  )
}
