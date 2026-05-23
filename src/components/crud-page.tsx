import { Plus } from "lucide-react"

interface CrudPageProps {
  title: string
  description?: string
  createLabel: string
  createAction: () => void
  children: React.ReactNode
}

export function CrudPageHeader({
  title,
  description,
  createLabel,
  createAction,
}: Omit<CrudPageProps, "children">) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        onClick={createAction}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        <Plus className="h-4 w-4" />
        {createLabel}
      </button>
    </div>
  )
}
