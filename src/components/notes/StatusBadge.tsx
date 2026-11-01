import { cn } from "@/lib/utils"
import { APPROVAL_LABELS, DEV_LABELS, type ApprovalStatus, type DevStatus } from "@/domain/ticket"

type Tone = "pending" | "approved" | "idle" | "study" | "resolved"

const TONE_CLASS: Record<Tone, string> = {
  pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending-ink)] [--dot:var(--status-pending-dot)]",
  approved: "bg-[var(--status-approved-bg)] text-[var(--status-approved-ink)] [--dot:var(--status-approved-dot)]",
  idle: "bg-[var(--status-idle-bg)] text-[var(--status-idle-ink)] [--dot:var(--status-idle-dot)]",
  study: "bg-[var(--status-study-bg)] text-[var(--status-study-ink)] [--dot:var(--status-study-dot)]",
  resolved: "bg-[var(--status-resolved-bg)] text-[var(--status-resolved-ink)] [--dot:var(--status-resolved-dot)]",
}

export const APPROVAL_TONE: Record<ApprovalStatus, Tone> = { pending: "pending", approved: "approved" }
export const DEV_TONE: Record<DevStatus, Tone> = { not_reviewed: "idle", under_study: "study", resolved: "resolved" }

type StatusBadgeProps =
  | { kind: "approval"; value: ApprovalStatus; size?: "sm" | "md"; className?: string }
  | { kind: "dev"; value: DevStatus; size?: "sm" | "md"; className?: string }

export function StatusBadge(props: StatusBadgeProps) {
  const tone = props.kind === "approval" ? APPROVAL_TONE[props.value] : DEV_TONE[props.value]
  const label = props.kind === "approval" ? APPROVAL_LABELS[props.value] : DEV_LABELS[props.value]
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        props.size === "md" ? "h-7 px-3 text-[13px]" : "h-6 px-2.5 text-xs",
        TONE_CLASS[tone],
        props.className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-[var(--dot)]" />
      {label}
    </span>
  )
}