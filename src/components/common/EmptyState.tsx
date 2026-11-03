import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-input-border/70 bg-surface-soft/40 text-center",
        compact ? "gap-2 px-6 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-surface text-brand ring-1 ring-line">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="grid max-w-md gap-1">
        <p className="font-heading text-[17px] leading-relaxed font-bold text-foreground">{title}</p>
        {description && <p className="text-[13px] leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
