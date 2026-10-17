export function PageHeader({ title, description, action }: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 mb-6 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h1 className="text-2xl font-heading font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm leading-relaxed text-muted-foreground mt-2">{description}</p>}
      </div>
      {action && <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">{action}</div>}
    </div>
  )
}
