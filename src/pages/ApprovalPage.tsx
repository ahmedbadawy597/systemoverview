import { useMemo, useState } from "react"
import { BadgeCheck, CalendarDays, Eye, ImageIcon, Inbox, Loader2, SearchX } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ListSkeleton } from "@/components/common/LoadingSkeleton"
import { RoleNotice } from "@/components/common/RoleNotice"
import { SegmentedTabs } from "@/components/common/SegmentedTabs"
import { TablePagination } from "@/components/common/TablePagination"
import { PageHeader, Panel } from "@/components/layout/PageHeader"
import { NoteFilters } from "@/components/notes/NoteFilters"
import { useNoteActions } from "@/components/notes/NoteActionsProvider"
import { StatusBadge } from "@/components/notes/StatusBadge"
import { Button } from "@/components/ui/button"
import { applyFilters, EMPTY_FILTERS, type TicketFilters } from "@/domain/stats"
import type { ApprovalStatus, Ticket } from "@/domain/ticket"
import { useTickets } from "@/hooks/useTickets"
import { formatDateTime, formatId, formatNumber, formatRelative } from "@/lib/format"

const PAGE_SIZE = 8

export function ApprovalPage() {
  const { data, isLoading, error, refetch, isRefetching } = useTickets()
  const [tab, setTab] = useState<ApprovalStatus>("pending")
  const [filters, setFiltersState] = useState<TicketFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const all = useMemo(() => data ?? [], [data])

  const counts = useMemo(
    () => ({ pending: all.filter((t) => t.approval === "pending").length, approved: all.filter((t) => t.approval === "approved").length }),
    [all],
  )

  const list = useMemo(() => {
    const rows = applyFilters(all, { ...filters, approval: tab })
    // The queue is worked oldest first; the approved history reads newest first.
    return tab === "pending" ? [...rows].reverse() : rows
  }, [all, filters, tab])

  const setFilters = (patch: Partial<TicketFilters>) => {
    setFiltersState((f) => ({ ...f, ...patch }))
    setPage(1)
  }
  const visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="grid gap-6">
      <PageHeader
        title="تصديق الملاحظات"
        description={
          isLoading
            ? "جارٍ تحميل قائمة الملاحظات…"
            : counts.pending
              ? `${formatNumber(counts.pending)} ملاحظة بانتظار التصديق، مرتبة من الأقدم إلى الأحدث.`
              : "لا توجد ملاحظات بانتظار التصديق حاليًا."
        }
      />

      <RoleNotice permission="approve" action="تصديق الملاحظات" />
      {error && <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />}

      <SegmentedTabs
        label="تصفية حسب حالة التصديق"
        value={tab}
        onChange={(v) => {
          setTab(v)
          setPage(1)
        }}
        options={[
          { value: "pending", label: "بانتظار التصديق", count: counts.pending, dot: "var(--status-pending-dot)" },
          { value: "approved", label: "تم التصديق", count: counts.approved, dot: "var(--status-approved-dot)" },
        ]}
      />

      <Panel className="overflow-hidden">
        <div className="border-b border-line-soft p-5">
          <NoteFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(EMPTY_FILTERS)}
            fields={["query", "dates"]}
          />
        </div>

        {isLoading ? (
          <div className="p-5">
            <ListSkeleton />
          </div>
        ) : list.length === 0 ? (
          <div className="p-5">
            {filters.query || filters.from || filters.to ? (
              <EmptyState icon={SearchX} title="لا توجد نتائج" description="لا توجد ملاحظات تطابق البحث في هذا التبويب." />
            ) : tab === "pending" ? (
              <EmptyState icon={Inbox} title="لا توجد ملاحظات بانتظار التصديق" description="تم تصديق جميع الملاحظات المسجلة. ستظهر هنا الملاحظات الجديدة فور إضافتها." />
            ) : (
              <EmptyState icon={BadgeCheck} title="لم يتم تصديق أي ملاحظة بعد" />
            )}
          </div>
        ) : (
          <ul className="stagger divide-y divide-line-soft [--stagger-step:40ms]" aria-label={tab === "pending" ? "ملاحظات بانتظار التصديق" : "ملاحظات تم تصديقها"}>
            {visible.map((t) => (
              <ApprovalRow key={t.id} ticket={t} />
            ))}
          </ul>
        )}

        {!isLoading && list.length > 0 && (
          <TablePagination page={page} pageSize={PAGE_SIZE} total={list.length} onPageChange={setPage} />
        )}
      </Panel>
    </div>
  )
}

function ApprovalRow({ ticket }: { ticket: Ticket }) {
  const actions = useNoteActions()
  const approving = actions.approving === ticket.id
  return (
    <li className="grid gap-4 px-5 py-5 transition-colors hover:bg-surface-soft/50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="grid min-w-0 gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular font-bold">رقم {formatId(ticket.id)}</span>
          <span className="flex items-center gap-1" title={formatDateTime(ticket.createdAt)}>
            <CalendarDays className="size-3.5" aria-hidden />
            أضيفت {formatRelative(ticket.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <ImageIcon className="size-3.5" aria-hidden />
            {ticket.images.length ? `${formatNumber(ticket.images.length)} صورة` : "بدون صور"}
          </span>
          {ticket.approval === "approved" && <StatusBadge kind="approval" value="approved" />}
        </div>
        <Link to={`/notes/${encodeURIComponent(ticket.id)}`} className="text-[15px] leading-7 font-bold text-foreground hover:text-brand">
          {ticket.name}
        </Link>
        <p className="line-clamp-2 max-w-3xl text-[13px] leading-6 text-muted-foreground">{ticket.description}</p>
      </div>

      <div className="flex items-center gap-2 md:justify-end">
        {ticket.images.length > 0 && (
          <span className="me-1 hidden size-12 overflow-hidden rounded-md ring-1 ring-line lg:block">
            <img src={ticket.images[0]} alt="" className="size-full object-cover" loading="lazy" />
          </span>
        )}
        <Button asChild variant="outline" className="flex-1 md:flex-none">
          <Link to={`/notes/${encodeURIComponent(ticket.id)}`}>
            <Eye aria-hidden />
            عرض
          </Link>
        </Button>
        {ticket.approval === "pending" ? (
          <Button onClick={() => void actions.approve(ticket)} disabled={approving} className="flex-1 md:flex-none">
            {approving ? <Loader2 className="animate-spin" aria-hidden /> : <BadgeCheck aria-hidden />}
            تصديق
          </Button>
        ) : (
          <span className="tabular hidden text-xs text-muted-foreground md:inline">
            {ticket.approvedAt ? formatDateTime(ticket.approvedAt) : "—"}
          </span>
        )}
      </div>
    </li>
  )
}
