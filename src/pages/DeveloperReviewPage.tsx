import { useState } from "react"
import { ClipboardCheck, PencilLine, SearchX } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { TableSkeleton } from "@/components/common/LoadingSkeleton"
import { PermissionEmpty } from "@/components/common/PermissionEmpty"
import { SegmentedTabs } from "@/components/common/SegmentedTabs"
import { TablePagination } from "@/components/common/TablePagination"
import { PageHeader, Panel } from "@/components/layout/PageHeader"
import { DeveloperReviewForm } from "@/components/notes/DeveloperReviewForm"
import { NoteFilters } from "@/components/notes/NoteFilters"
import { DEV_TONE, StatusBadge } from "@/components/notes/StatusBadge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EMPTY_FILTERS, type TicketFilters } from "@/domain/stats"
import { DEV_LABELS, DEV_ORDER, type DevStatus, type Ticket } from "@/domain/ticket"
import { useTicket, useTicketList, useTicketStats, useUpdateDevReview } from "@/hooks/useTickets"
import { formatId, formatNumber, formatRelative } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuth } from "@/services/auth/AuthProvider"
import type { TicketDevFilter } from "@/services/api/ticketsApi"

type View = "open" | DevStatus
const VIEWS: View[] = ["open", ...DEV_ORDER]
const PAGE_SIZE = 10

const EDGE: Record<string, string> = {
  idle: "before:bg-transparent",
  study: "before:bg-[var(--status-study-dot)]",
  resolved: "before:bg-[var(--status-resolved-dot)]",
}

export function DeveloperReviewPage() {
  const { can } = useAuth()
  const allowed = can("devReview")
  const [params, setParams] = useSearchParams()
  const [filters, setFiltersState] = useState<TicketFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)

  const view: View = VIEWS.includes(params.get("status") as View) ? (params.get("status") as View) : "open"
  const setView = (next: View) => {
    setParams(next === "open" ? {} : { status: next }, { replace: true })
    setPage(1)
  }

  const statsQuery = useTicketStats({}, allowed)
  const counts = {
    open: (statsQuery.data?.notReviewed ?? 0) + (statsQuery.data?.underStudy ?? 0),
    not_reviewed: statsQuery.data?.notReviewed ?? 0,
    under_study: statsQuery.data?.underStudy ?? 0,
    resolved: statsQuery.data?.resolved ?? 0,
  }

  const devStatus: TicketDevFilter = view === "open" ? "open" : view

  const { data, isLoading, error, refetch, isRefetching } = useTicketList(
    {
      page,
      limit: PAGE_SIZE,
      q: filters.query,
      approval: filters.approval,
      devStatus,
      sort: "createdAt",
      order: "desc",
    },
    allowed,
  )

  const list = data?.items ?? []
  const total = data?.total ?? 0
  const editingQuery = useTicket(editingId ?? undefined)
  const liveEditing = editingQuery.ticket ?? list.find((t) => t.id === editingId) ?? null

  if (!allowed) {
    return (
      <div className="grid gap-6">
        <PageHeader title="مراجعة المبرمجين" description="تحديث حالة المراجعة الفنية للملاحظات." />
        <PermissionEmpty permission="devReview" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="مراجعة المبرمجين"
        description={
          isLoading || statsQuery.isLoading
            ? "جارٍ تحميل الملاحظات…"
            : `${formatNumber(counts.open)} ملاحظة تحتاج متابعة: ${formatNumber(counts.not_reviewed)} لم تُراجع بعد و${formatNumber(counts.under_study)} قيد الدراسة.`
        }
      />

      {error && <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />}

      <SegmentedTabs
        label="تصفية حسب حالة المبرمجين"
        value={view}
        onChange={setView}
        options={[
          { value: "open", label: "تحتاج متابعة", count: counts.open },
          { value: "not_reviewed", label: DEV_LABELS.not_reviewed, count: counts.not_reviewed, dot: "var(--status-idle-dot)" },
          { value: "under_study", label: DEV_LABELS.under_study, count: counts.under_study, dot: "var(--status-study-dot)" },
          { value: "resolved", label: DEV_LABELS.resolved, count: counts.resolved, dot: "var(--status-resolved-dot)" },
        ]}
      />

      <Panel className="overflow-hidden">
        <div className="border-b border-line-soft p-5">
          <NoteFilters
            filters={filters}
            onChange={(patch) => {
              setFiltersState((f) => ({ ...f, ...patch }))
              setPage(1)
            }}
            onClear={() => {
              setFiltersState(EMPTY_FILTERS)
              setPage(1)
            }}
            fields={["query", "approval"]}
            searchPlaceholder="ابحث في الملاحظات أو ملاحظات المبرمجين…"
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : list.length === 0 ? (
          <div className="p-5">
            {filters.query || filters.approval !== "all" ? (
              <EmptyState icon={SearchX} title="لا توجد نتائج" description="لا توجد ملاحظات تطابق البحث في هذه الحالة." />
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title={view === "open" ? "لا توجد ملاحظات تحتاج متابعة" : `لا توجد ملاحظات بحالة «${DEV_LABELS[view]}»`}
                description={view === "open" ? "تم تلافي جميع الملاحظات المسجلة." : undefined}
              />
            )}
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[72px_minmax(0,1fr)_132px_200px_112px_44px] gap-4 border-b border-line px-5 py-3 text-[12.5px] font-semibold text-muted-foreground lg:grid">
              <span>الرقم</span>
              <span>الملاحظة وملاحظات المبرمجين</span>
              <span>التصديق</span>
              <span>الحالة</span>
              <span>آخر تحديث</span>
              <span className="sr-only">تحرير</span>
            </div>
            <ul className="stagger divide-y divide-line-soft [--stagger-step:35ms]">
              {list.map((t) => (
                <DevRow key={t.id} ticket={t} onEdit={() => setEditingId(t.id)} />
              ))}
            </ul>
            <TablePagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </>
        )}
      </Panel>

      <Sheet open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <SheetContent side="left" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          {liveEditing && (
            <>
              <SheetHeader className="gap-2 border-b border-line-soft p-6 pe-14">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="tabular text-xs font-bold text-muted-foreground">رقم {formatId(liveEditing.id)}</span>
                  <StatusBadge kind="approval" value={liveEditing.approval} />
                </div>
                <SheetTitle className="text-[17px] leading-7 font-bold">{liveEditing.name}</SheetTitle>
                <SheetDescription className="line-clamp-4 text-[13px] leading-6 whitespace-pre-line">
                  {liveEditing.description}
                </SheetDescription>
                <Link to={`/notes/${encodeURIComponent(liveEditing.id)}`} className="w-fit text-[13px] font-semibold text-brand-btn hover:underline">
                  عرض التفاصيل الكاملة والصور
                </Link>
              </SheetHeader>
              <div className="p-6">
                <DeveloperReviewForm ticket={liveEditing} onSaved={() => setEditingId(null)} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function DevRow({ ticket, onEdit }: { ticket: Ticket; onEdit: () => void }) {
  const { ensure } = useAuth()
  const update = useUpdateDevReview()
  const tone = DEV_TONE[ticket.devStatus]

  async function quickUpdate(next: DevStatus) {
    if (next === ticket.devStatus) return
    if (!(await ensure("devReview"))) return
    update.mutate({ id: ticket.id, devStatus: next, devNotes: ticket.devNotes })
  }

  return (
    <li
      className={cn(
        "relative grid gap-3 px-5 py-4 transition-colors before:absolute before:inset-y-3 before:start-0 before:w-[3px] before:rounded-full hover:bg-surface-soft/50 lg:grid-cols-[72px_minmax(0,1fr)_132px_200px_112px_44px] lg:items-center lg:gap-4",
        EDGE[tone],
      )}
    >
      <span className="tabular text-[13px] font-semibold text-muted-foreground">
        <span className="lg:hidden">رقم </span>
        {formatId(ticket.id)}
      </span>
      <div className="grid min-w-0 gap-1">
        <Link to={`/notes/${encodeURIComponent(ticket.id)}`} className="line-clamp-2 leading-6 font-semibold text-foreground hover:text-brand">
          {ticket.name}
        </Link>
        <p className={cn("line-clamp-2 text-[13px] leading-6", ticket.devNotes ? "text-muted-foreground" : "text-faint italic")}>
          {ticket.devNotes || "لا توجد ملاحظات من المبرمجين بعد."}
        </p>
      </div>
      <div>
        <StatusBadge kind="approval" value={ticket.approval} />
      </div>
      <Select value={ticket.devStatus} onValueChange={(v) => void quickUpdate(v as DevStatus)} disabled={update.isPending}>
        <SelectTrigger
          size="sm"
          className={cn(
            "w-full font-semibold",
            tone === "study" && "border-[#b7cde0] bg-[var(--status-study-bg)] text-[var(--status-study-ink)]",
            tone === "resolved" && "border-[#b3dcc4] bg-[var(--status-resolved-bg)] text-[var(--status-resolved-ink)]",
          )}
          aria-label={`تحديث حالة الملاحظة رقم ${formatId(ticket.id)}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {DEV_ORDER.map((s) => (
            <SelectItem key={s} value={s}>
              {DEV_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="tabular text-xs text-muted-foreground">
        <span className="lg:hidden">آخر تحديث: </span>
        {formatRelative(ticket.devUpdatedAt)}
      </span>
      <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`تحرير مراجعة الملاحظة رقم ${formatId(ticket.id)}`} className="absolute top-3 end-3 text-faint hover:text-foreground lg:static">
        <PencilLine className="size-4" />
      </Button>
    </li>
  )
}
