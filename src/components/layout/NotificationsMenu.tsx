import { useMemo, useState } from "react"
import { Bell, BadgeCheck, Wrench } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DEV_LABELS } from "@/domain/ticket"
import { useTickets } from "@/hooks/useTickets"
import { formatId, formatNumber, formatRelative } from "@/lib/format"

const WEEK = 7 * 86_400_000

/** Derived from the sheet: notes waiting for approval, and developer updates from the last 7 days. */
export function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const { data = [] } = useTickets()

  const { pending, updates } = useMemo(() => {
    const now = Date.now()
    return {
      pending: data.filter((t) => t.approval === "pending"),
      updates: data
        .filter((t) => t.devUpdatedAt && now - new Date(t.devUpdatedAt).getTime() < WEEK)
        .sort((a, b) => new Date(b.devUpdatedAt!).getTime() - new Date(a.devUpdatedAt!).getTime()),
    }
  }, [data])

  const count = pending.length
  const close = () => setOpen(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-[#3d4945] hover:bg-surface"
          aria-label={count ? `التنبيهات: ${formatNumber(count)} ملاحظة بانتظار التصديق` : "التنبيهات"}
        >
          <Bell className="size-[19px]" strokeWidth={1.75} />
          {count > 0 && (
            <span className="tabular absolute -top-0.5 -end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {formatNumber(count)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(360px,calc(100vw-24px))] gap-0 p-0">
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
          <p className="text-[14px] font-bold">التنبيهات</p>
          <span className="text-xs text-muted-foreground">آخر ٧ أيام</span>
        </div>
        <div className="max-h-[380px] overflow-y-auto py-1">
          {pending.length === 0 && updates.length === 0 && (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">لا توجد تنبيهات جديدة.</p>
          )}
          {pending.length > 0 && (
            <Group title={`بانتظار التصديق (${formatNumber(pending.length)})`}>
              {pending.slice(0, 4).map((t) => (
                <Item key={t.id} to={`/notes/${t.id}`} onClick={close} icon={<BadgeCheck className="size-4 text-gold" />}
                  title={t.name}
                  meta={`رقم ${formatId(t.id)} · أضيفت ${formatRelative(t.createdAt)}`}
                />
              ))}
              {pending.length > 4 && (
                <Link to="/approval" onClick={close} className="block px-4 py-2 text-[13px] font-semibold text-brand-btn hover:underline">
                  عرض كل الملاحظات بانتظار التصديق
                </Link>
              )}
            </Group>
          )}
          {updates.length > 0 && (
            <Group title="تحديثات المبرمجين">
              {updates.slice(0, 4).map((t) => (
                <Item key={t.id} to={`/notes/${t.id}`} onClick={close} icon={<Wrench className="size-4 text-[var(--status-study-dot)]" />}
                  title={t.name}
                  meta={`${DEV_LABELS[t.devStatus]} · ${formatRelative(t.devUpdatedAt)}`}
                />
              ))}
            </Group>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <p className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function Item({ to, onClick, icon, title, meta }: { to: string; onClick: () => void; icon: React.ReactNode; title: string; meta: string }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-surface-soft focus-visible:bg-surface-soft focus-visible:outline-none">
      <span className="mt-0.5 flex size-7 flex-none items-center justify-center rounded-full bg-surface-soft">{icon}</span>
      <span className="grid min-w-0 gap-0.5">
        <span className="truncate text-[13px] font-semibold text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </span>
    </Link>
  )
}
