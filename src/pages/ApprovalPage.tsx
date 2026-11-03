import { useState } from "react"
import { BadgeCheck, CalendarDays, Eye, ImageIcon, Inbox, Loader2, SearchX } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { ListSkeleton } from "@/components/common/LoadingSkeleton"
import { PermissionEmpty } from "@/components/common/PermissionEmpty"
import { SegmentedTabs } from "@/components/common/SegmentedTabs"
import { TablePagination } from "@/components/common/TablePagination"
import { PageHeader, Panel } from "@/components/layout/PageHeader"
import { NoteFilters } from "@/components/notes/NoteFilters"
import { useNoteActions } from "@/components/notes/NoteActionsProvider"
import { StatusBadge } from "@/components/notes/StatusBadge"
import { Button } from "@/components/ui/button"
import { EMPTY_FILTERS, type TicketFilters } from "@/domain/stats"
import type { ApprovalStatus, Ticket } from "@/domain/ticket"
import { useTicketList, useTicketStats } from "@/hooks/useTickets"
import { formatDateTime, formatId, formatNumber, formatRelative } from "@/lib/format"
import { useAuth } from "@/services/auth/AuthProvider"

const PAGE_SIZE = 8

export function ApprovalPage() {
  const { can } = useAuth()
  const [tab, setTab] = useState<ApprovalStatus>("pending")
  const [filters, setFiltersState] = useState<TicketFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const allowed = can("approve")
  const statsQuery = useTicketStats({}, allowed)
  const counts = {
    pending: statsQuery.data?.pending ?? 0,
    approved: statsQuery.data?.approved ?? 0,
  }

  const { data, isLoading, error, refetch, isRefetching } = useTicketList(
    {
      page,
      limit: PAGE_SIZE,
      q: filters.query,
      approval: tab,
      from: filters.from,
      to: filters.to,
      sort: "createdAt",
      order: tab === "pending" ? "asc" : "desc",
    },
    allowed,
  )

  const list = data?.items ?? []
  const total = data?.total ?? 0

  const setFilters = (patch: Partial<TicketFilters>) => {
    setFiltersState((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  if (!allowed) {
    return (
      <div className="grid gap-6">
        <PageHeader title="تصديق الملاحظات" description="تصديق الملاحظات المسجلة بعد مراجعتها." />
        <PermissionEmpty permission="approve" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="تصديق الملاحظات"
        description={
          isLoading || statsQuery.isLoading
            ? "جارٍ تحميل قائمة الملاحظات…"
            : counts.pending
              ? `${formatNumber(counts.pending)} ملاحظة بانتظار التصديق، مرتبة من الأقدم إلى الأحدث.`
              : "لا توجد ملاحظات بانتظار التصديق حاليًا."
        }
      />

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
            {list.map((t) => (
              <ApprovalRow key={t.id} ticket={t} />
            ))}
          </ul>
        )}

        {!isLoading && total > 0 && (
          <TablePagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular text-[12.5px] font-bold text-brand">#{formatId(ticket.id)}</span>
          {ticket.approval === "approved" && <StatusBadge kind="approval" value="approved" />}
          {ticket.images.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
              <ImageIcon className="size-3.5" aria-hidden />
              {formatNumber(ticket.images.length)}
            </span>
          )}
        </div>
        <p className="text-[15px] leading-7 font-bold text-foreground">{ticket.name}</p>
        <p className="line-clamp-2 text-[13px] leading-6 text-muted-foreground">{ticket.description}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1" title={formatDateTime(ticket.createdAt)}>
            <CalendarDays className="size-3.5" aria-hidden />
            {formatRelative(ticket.createdAt)}
          </span>
          {ticket.approvedAt ? (
            <span>صُدّقت {formatRelative(ticket.approvedAt)}</span>
          ) : null}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to={`/notes/${encodeURIComponent(ticket.id)}`}>
            <Eye aria-hidden />
            عرض
          </Link>
        </Button>
        {ticket.approval === "pending" ? (
          <Button size="sm" disabled={approving} onClick={() => void actions.approve(ticket)}>
            {approving ? <Loader2 className="animate-spin" aria-hidden /> : <BadgeCheck aria-hidden />}
            تصديق
          </Button>
        ) : null}
      </div>
    </li>
  )
}
