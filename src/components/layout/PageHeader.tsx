import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="grid gap-1.5">
        <h1 className="text-[22px] leading-tight font-bold text-foreground sm:text-2xl">{title}</h1>
        {description && <p className="max-w-2xl text-[14px] leading-7 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface shadow-card", className)}>{children}</section>
  )
}

export function PanelHeader({
  title,
  description,
  actions,
  className,
  as: Heading = "h2",
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
  as?: "h2" | "h3"
}) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4", className)}>
      <div className="grid gap-0.5">
        <Heading className="text-[15px] font-bold text-foreground">{title}</Heading>
        {description && <p className="text-[13px] leading-6 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
