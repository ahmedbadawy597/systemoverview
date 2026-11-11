import { useEffect, useRef } from "react"
import { AppWindow, ArrowRight, BadgeCheck, CalendarDays, FileQuestion, Hash, ImageIcon, Loader2, MessageCircle, Trash2 } from "lucide-react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { DetailSkeleton } from "@/components/common/LoadingSkeleton"
import { Panel, PanelHeader } from "@/components/layout/PageHeader"
import { DeveloperReviewForm } from "@/components/notes/DeveloperReviewForm"
import { ImageGallery } from "@/components/notes/ImageGallery"
import { useNoteActions } from "@/components/notes/NoteActionsProvider"
import { StatusBadge } from "@/components/notes/StatusBadge"
import { Button } from "@/components/ui/button"
import { useTicket } from "@/hooks/useTickets"
import { formatDate, formatDateTime, formatId, formatNumber, formatTime } from "@/lib/format"
import { useAuth } from "@/services/auth/AuthProvider"

export function NoteDetailsPage() {
  const { id } = useParams()
  const { ticket, isLoading, error, refetch, isRefetching } = useTicket(id)
  const actions = useNoteActions()
  const { can } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const reviewRef = useRef<HTMLElement>(null)
  const statusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (params.get("review") !== "1" || !ticket) return
    reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    const id = setTimeout(() => statusRef.current?.focus(), 350)
    setParams((p) => {
      p.delete("review")
      return p
    }, { replace: true })
    return () => clearTimeout(id)
  }, [params, ticket, setParams])

  if (isLoading) return <DetailSkeleton />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />
  if (!ticket) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="الملاحظة غير موجودة"
        description={`لم يتم العثور على ملاحظة بالرقم ${formatId(id ?? "")}. ربما حُذفت أو أن الرابط غير صحيح.`}
        action={
          <Button asChild variant="outline">
            <Link to="/notes">العودة إلى جميع الملاحظات</Link>
          </Button>
        }
      />
    )
  }

  const approving = actions.approving === ticket.id

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <Link to="/notes" className="flex w-fit items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-brand">
          <ArrowRight className="size-4" aria-hidden />
          جميع الملاحظات
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="grid min-w-0 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular inline-flex h-6 items-center gap-1 rounded-md bg-surface px-2 text-xs font-bold text-muted-foreground ring-1 ring-line">
                <Hash className="size-3" aria-hidden />
                {formatId(ticket.id)}
              </span>
              <StatusBadge kind="approval" value={ticket.approval} />
              <StatusBadge kind="dev" value={ticket.devStatus} />
            </div>
            <h1 className="font-heading text-[24px] leading-relaxed font-bold text-foreground sm:text-[28px]">{ticket.name}</h1>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden />
                أضيفت {formatDate(ticket.createdAt)} · الساعة {formatTime(ticket.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <ImageIcon className="size-3.5" aria-hidden />
                {ticket.images.length ? `${formatNumber(ticket.images.length)} صورة مرفقة` : "بدون صور"}
              </span>
              {ticket.appName && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-tint px-2 py-0.5 text-[12px] font-semibold text-brand ring-1 ring-brand/15">
                  <AppWindow className="size-3.5" aria-hidden />
                  {ticket.appName}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-none flex-wrap gap-2">
            <Button variant="outline" onClick={() => actions.share(ticket)}>
              <MessageCircle aria-hidden />
              مشاركة عبر واتساب
            </Button>
            {can("delete") && (
              <Button
                variant="outline"
                className="text-danger hover:border-danger/40 hover:bg-[#fdf3f2] hover:text-danger"
                onClick={() => void actions.remove(ticket, { onDeleted: () => navigate("/notes", { replace: true }) })}
              >
                <Trash2 aria-hidden />
                حذف
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6">
          <Panel>
            <PanelHeader title="وصف الملاحظة" />
            <p className="px-5 pb-6 text-[15px] leading-8 whitespace-pre-line text-foreground">{ticket.description || "—"}</p>
          </Panel>

          <Panel>
            <PanelHeader
              title="الصور المرفقة"
              description={ticket.images.length ? `${formatNumber(ticket.images.length)} صورة — اضغط على الصورة لعرضها بحجم كامل` : undefined}
            />
            <div className="px-5 pb-5">
              {ticket.images.length ? (
                <ImageGallery images={ticket.images} title={ticket.name} />
              ) : (
                <EmptyState compact icon={ImageIcon} title="لا توجد صور مرفقة" description="لم تُرفق صور مع هذه الملاحظة عند تسجيلها." />
              )}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel>
            <PanelHeader title="التصديق" />
            <div className="grid gap-4 px-5 pb-5">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-soft p-4">
                <span className="text-[13px] text-muted-foreground">الحالة الحالية</span>
                <StatusBadge kind="approval" value={ticket.approval} size="md" />
              </div>
              {ticket.approval === "approved" ? (
                <p className="flex items-center gap-2 text-[13px] text-foreground">
                  <BadgeCheck className="size-4 text-brand-btn" aria-hidden />
                  تم التصديق
                  {ticket.approvedAt ? (
                    <span className="tabular text-muted-foreground">في {formatDateTime(ticket.approvedAt)}</span>
                  ) : (
                    <span className="text-muted-foreground">— لم يُسجّل وقت التصديق</span>
                  )}
                </p>
              ) : can("approve") ? (
                <>
                  <p className="text-[13px] leading-6 text-muted-foreground">
                    بعد التصديق تُعتمد الملاحظة رسميًا وتنتقل لمتابعة فريق المبرمجين.
                  </p>
                  <Button onClick={() => void actions.approve(ticket)} disabled={approving} size="lg" className="w-full">
                    {approving ? <Loader2 className="animate-spin" aria-hidden /> : <BadgeCheck aria-hidden />}
                    تصديق الملاحظة
                  </Button>
                </>
              ) : (
                <p className="text-[13px] leading-6 text-muted-foreground">الملاحظة بانتظار التصديق من صاحب الصلاحية.</p>
              )}
            </div>
          </Panel>

          <Panel>
            <section ref={reviewRef} className="scroll-mt-24" aria-labelledby="dev-review-title">
              <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
                <h2 id="dev-review-title" className="text-[15px] font-bold">
                  مراجعة المبرمجين
                </h2>
                <StatusBadge kind="dev" value={ticket.devStatus} />
              </div>
              <div className="px-5 pb-5">
                {can("devReview") ? (
                  <DeveloperReviewForm ref={statusRef} ticket={ticket} />
                ) : (
                  <p className="text-[13px] leading-6 text-muted-foreground">
                    {ticket.devNotes?.trim() || "لا توجد ملاحظات من المبرمجين بعد."}
                  </p>
                )}
              </div>
            </section>
          </Panel>
        </div>
      </div>
    </div>
  )
}
