import { useState, type ReactNode } from "react"
import {
  BadgeCheck,
  Bell,
  CheckCheck,
  FileText,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Wrench,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { notificationHref, type AppNotification } from "@/domain/notification"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationsRead,
  useNotificationsList,
  useUnreadNotificationsCount,
} from "@/hooks/useNotifications"
import { formatNumber, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuth } from "@/services/auth/AuthProvider"

function iconFor(type: string): ReactNode {
  if (type.startsWith("ticket.approved") || type === "ticket.created") {
    return <BadgeCheck className="size-4 text-gold" />
  }
  if (type.startsWith("ticket.dev")) {
    return <Wrench className="size-4 text-[var(--status-study-dot)]" />
  }
  if (type.startsWith("chat.")) {
    return <MessageCircle className="size-4 text-brand" />
  }
  if (type.startsWith("report.")) {
    return <FileText className="size-4 text-brand" />
  }
  if (type.startsWith("app.")) {
    return <LayoutGrid className="size-4 text-brand" />
  }
  return <Bell className="size-4 text-faint" />
}

export function NotificationsMenu() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const unreadQuery = useUnreadNotificationsCount(Boolean(user))
  const listQuery = useNotificationsList(open && Boolean(user), 20)
  const markRead = useMarkNotificationsRead()
  const markAll = useMarkAllNotificationsRead()

  const count = unreadQuery.data ?? 0
  const items = listQuery.data?.items ?? []
  const close = () => setOpen(false)

  async function openItem(n: AppNotification) {
    if (!n.readAt) {
      try {
        await markRead.mutateAsync([n.id])
      } catch {
        // still navigate
      }
    }
    close()
    const href = notificationHref(n)
    if (href) navigate(href)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-[#3d4945] hover:bg-surface"
          aria-label={count ? `التنبيهات: ${formatNumber(count)} غير مقروء` : "التنبيهات"}
        >
          <Bell className="size-[19px]" strokeWidth={1.75} />
          {count > 0 && (
            <span className="tabular absolute -top-0.5 -end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white ring-2 ring-background">
              {formatNumber(count > 99 ? 99 : count)}
              {count > 99 ? "+" : ""}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(380px,calc(100vw-24px))] gap-0 p-0">
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
          <div className="grid gap-0.5">
            <p className="text-[14px] font-bold">التنبيهات</p>
            <p className="text-[11.5px] text-muted-foreground">
              {count > 0 ? `${formatNumber(count)} غير مقروء` : "لا توجد تنبيهات غير مقروءة"}
            </p>
          </div>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-[12px]"
              disabled={markAll.isPending}
              onClick={() => void markAll.mutateAsync()}
            >
              {markAll.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCheck className="size-3.5" />}
              قراءة الكل
            </Button>
          )}
        </div>

        <div className="max-h-[420px] overflow-y-auto py-1">
          {listQuery.isLoading ? (
            <p className="flex items-center justify-center gap-2 px-4 py-10 text-[13px] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              جارٍ التحميل…
            </p>
          ) : listQuery.isError ? (
            <div className="grid gap-2 px-4 py-8 text-center">
              <p className="text-[13px] text-danger">تعذّر تحميل التنبيهات.</p>
              <Button variant="outline" size="sm" className="mx-auto" onClick={() => void listQuery.refetch()}>
                إعادة المحاولة
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">لا توجد تنبيهات حتى الآن.</p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {items.map((n) => {
                const href = notificationHref(n)
                const unread = !n.readAt
                const content = (
                  <>
                    <span className="mt-0.5 flex size-8 flex-none items-center justify-center rounded-full bg-surface-soft">
                      {iconFor(n.type)}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className={cn("truncate text-[13px]", unread ? "font-bold text-foreground" : "font-semibold text-foreground")}>
                          {n.title}
                        </span>
                        {unread && <span className="size-1.5 flex-none rounded-full bg-gold" aria-label="غير مقروء" />}
                      </span>
                      <span className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">{n.body}</span>
                      <span className="tabular text-[11px] text-faint">{formatRelative(n.createdAt)}</span>
                    </span>
                  </>
                )

                return (
                  <li key={n.id}>
                    {href ? (
                      <button
                        type="button"
                        onClick={() => void openItem(n)}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-surface-soft focus-visible:bg-surface-soft focus-visible:outline-none",
                          unread && "bg-[#fbf8ef]/60",
                        )}
                      >
                        {content}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (unread) void markRead.mutateAsync([n.id])
                        }}
                        className={cn(
                          "flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-surface-soft",
                          unread && "bg-[#fbf8ef]/60",
                        )}
                      >
                        {content}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {items.some((n) => n.type.startsWith("ticket.") && notificationHref(n)) && (
          <div className="border-t border-line-soft px-4 py-2">
            <Link
              to="/notes"
              onClick={close}
              className="block text-center text-[12.5px] font-semibold text-brand-btn hover:underline"
            >
              عرض الملاحظات
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
