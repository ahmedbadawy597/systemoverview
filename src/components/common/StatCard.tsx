import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { useCountUp } from "@/hooks/useCountUp"
import { formatNumber, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

export type StatTone = "brand" | "gold" | "study" | "resolved"

const ICON_TONE: Record<StatTone, string> = {
  brand: "bg-surface-tint text-brand ring-brand/10",
  gold: "bg-[var(--status-pending-bg)] text-[#7d6420] ring-gold/15",
  study: "bg-[var(--status-study-bg)] text-[var(--status-study-ink)] ring-[var(--status-study-dot)]/15",
  resolved: "bg-[var(--status-resolved-bg)] text-[var(--status-resolved-ink)] ring-[var(--status-resolved-dot)]/15",
}

const ACCENT: Record<StatTone, string> = {
  brand: "bg-brand",
  gold: "bg-gold",
  study: "bg-[var(--status-study-dot)]",
  resolved: "bg-[var(--status-resolved-dot)]",
}

interface StatCardProps {
  label: string
  value: number
  subtitle: string
  icon: LucideIcon
  tone?: StatTone
  /** Share of the total, shown as a percentage beside the subtitle. */
  share?: number
  to?: string
  loading?: boolean
}

function AnimatedNumber({ value }: { value: number }) {
  const shown = useCountUp(value)
  return (
    <p className="tabular -mt-1 text-[30px] leading-none font-bold text-foreground" aria-label={formatNumber(value)}>
      <span aria-hidden>{formatNumber(shown)}</span>
    </p>
  )
}

export function StatCard({ label, value, subtitle, icon: Icon, tone = "brand", share, to, loading }: StatCardProps) {
  const body = (
    <>
      <span
        className={cn(
          "pointer-events-none absolute inset-x-5 top-0 h-[2px] origin-center scale-x-0 rounded-b-full opacity-0 transition-[transform,opacity] duration-300 ease-out group-hover:scale-x-100 group-hover:opacity-100",
          ACCENT[tone],
        )}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-10 flex-none items-center justify-center rounded-lg ring-1 ring-inset transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110",
            ICON_TONE[tone],
          )}
        >
          <Icon className="size-[19px]" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      {loading ? <Skeleton className="mt-1 h-9 w-20" /> : <AnimatedNumber value={value} />}
      <p className="mt-auto flex items-center gap-2 text-[13px] leading-5 text-muted-foreground">
        {share !== undefined && !loading && (
          <span className="tabular rounded-full bg-surface-soft px-2 py-0.5 text-xs font-semibold text-foreground ring-1 ring-line-soft">
            {formatPercent(share)}
          </span>
        )}
        <span>{subtitle}</span>
      </p>
    </>
  )

  const className =
    "group relative flex min-h-[148px] flex-col gap-4 overflow-hidden rounded-xl border border-line bg-surface p-5 shadow-card transition-[border-color,box-shadow,transform] duration-300 ease-out"

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          className,
          "hover:-translate-y-1 hover:border-brand-btn/25 hover:shadow-raised active:translate-y-0 active:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        {body}
      </Link>
    )
  }
  return <div className={cn(className, "hover:shadow-raised")}>{body}</div>
}
