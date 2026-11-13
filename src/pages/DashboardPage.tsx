import { ArrowLeft, BadgeCheck, ClipboardList, FilePlus2, Hourglass, Printer, SearchCheck } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader, Panel, PanelHeader } from "@/components/layout/PageHeader"
import { NotesTable } from "@/components/notes/NotesTable"
import { usePrintReport } from "@/components/report/PrintReportProvider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EMPTY_FILTERS, type TicketStats } from "@/domain/stats"
import { useTicketList, useTicketStats } from "@/hooks/useTickets"
import { formatNumber, formatPercent } from "@/lib/format"
import { useAuth } from "@/services/auth/AuthProvider"

export function DashboardPage() {
  const { can } = useAuth()
  const statsQuery = useTicketStats()
  const recentQuery = useTicketList({ page: 1, limit: 8, sort: "createdAt", order: "desc" })
  const { requestPrint } = usePrintReport()
  const canCreate = can("create")
  const canApprove = can("approve")
  const canReview = can("devReview")
  const canPrint = can("print")

  const stats = statsQuery.data ?? { total: 0, pending: 0, approved: 0, notReviewed: 0, underStudy: 0, resolved: 0 }
  const tickets = recentQuery.data?.items ?? []
  const isLoading = statsQuery.isLoading || recentQuery.isLoading
  const error = statsQuery.error || recentQuery.error
  const refetch = () => {
    void statsQuery.refetch()
    void recentQuery.refetch()
  }
  const isRefetching = statsQuery.isRefetching || recentQuery.isRefetching

  const finding = !stats.total
    ? "لا توجد ملاحظات مسجلة بعد."
    : !stats.pending
      ? "جميع الملاحظات المسجلة تم تصديقها."
      : `${formatNumber(stats.pending)} ملاحظة بانتظار التصديق.`

  return (
    <div className="grid gap-6">
      <PageHeader
        title="نظرة عامة على الملاحظات"
        description={isLoading ? "جارٍ تحميل البيانات من السجل…" : finding}
        actions={
          canCreate ? (
            <Button asChild>
              <Link to="/notes/new">
                <FilePlus2 aria-hidden />
                إضافة ملاحظة
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorState error={error} onRetry={refetch} retrying={isRefetching} />}

      <div className="stagger grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي الملاحظات"
          value={stats.total}
          subtitle="كل الملاحظات المسجلة بالنظام"
          icon={ClipboardList}
          tone="brand"
          to="/notes"
          loading={isLoading}
        />
        <StatCard
          label="ملاحظات بانتظار التصديق"
          value={stats.pending}
          subtitle="من إجمالي الملاحظات"
          share={stats.total ? stats.pending / stats.total : 0}
          icon={Hourglass}
          tone="gold"
          to={canApprove ? "/approval" : undefined}
          loading={isLoading}
        />
        <StatCard
          label="ملاحظات قيد الدراسة"
          value={stats.underStudy}
          subtitle="لدى فريق المبرمجين"
          share={stats.total ? stats.underStudy / stats.total : 0}
          icon={SearchCheck}
          tone="study"
          to={canReview ? "/developer?status=under_study" : undefined}
          loading={isLoading}
        />
        <StatCard
          label="ملاحظات تم تلافيها"
          value={stats.resolved}
          subtitle="تمت معالجتها نهائيًا"
          share={stats.total ? stats.resolved / stats.total : 0}
          icon={BadgeCheck}
          tone="resolved"
          to={canReview ? "/developer?status=resolved" : undefined}
          loading={isLoading}
        />
      </div>

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="أحدث الملاحظات"
            description={isLoading ? undefined : `آخر ${formatNumber(tickets.length)} ملاحظة`}
            actions={
              <Button asChild variant="ghost" size="sm" className="text-brand-btn hover:text-brand">
                <Link to="/notes">
                  عرض الكل
                  <ArrowLeft aria-hidden />
                </Link>
              </Button>
            }
          />
          <NotesTable
            tickets={tickets}
            variant="compact"
            loading={isLoading}
            empty={
              <EmptyState
                icon={ClipboardList}
                title="لا توجد ملاحظات بعد"
                description="ابدأ بتسجيل أول ملاحظة لتظهر هنا مع حالتها."
                action={
                  canCreate ? (
                    <Button asChild>
                      <Link to="/notes/new">إضافة ملاحظة</Link>
                    </Button>
                  ) : undefined
                }
              />
            }
          />
        </Panel>

        <div className="grid items-start gap-6 md:grid-cols-2 2xl:grid-cols-1">
          <Panel>
            <PanelHeader title="توزيع الحالات" description="نسبة كل حالة من إجمالي الملاحظات" />
            <StatusOverview stats={stats} loading={isLoading} />
          </Panel>

          <Panel>
            <PanelHeader title="إجراءات سريعة" />
            <div className="grid gap-2 px-5 pb-5">
              {canCreate && (
                <QuickAction to="/notes/new" icon={FilePlus2} label="إضافة ملاحظة" hint="تسجيل ملاحظة جديدة مع الصور" primary />
              )}
              {canApprove && (
                <QuickAction to="/approval" icon={BadgeCheck} label="مراجعة الملاحظات" hint={`${formatNumber(stats.pending)} بانتظار التصديق`} />
              )}
              {canPrint && (
                <button
                  type="button"
                  onClick={() => requestPrint({ filters: EMPTY_FILTERS })}
                  disabled={isLoading}
                  className="group flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-start transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-btn/30 hover:shadow-card active:translate-y-0 disabled:opacity-60"
                >
                  <Printer className="size-[18px] flex-none text-brand" strokeWidth={1.75} aria-hidden />
                  <span className="grid flex-1">
                    <span className="text-[14px] font-bold text-foreground">طباعة التقرير</span>
                    <span className="text-xs text-muted-foreground">تقرير رسمي من الخادم</span>
                  </span>
                  <ArrowLeft className="size-4 text-faint transition-transform group-hover:-translate-x-1 duration-200" aria-hidden />
                </button>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  to,
  icon: Icon,
  label,
  hint,
  primary,
}: {
  to: string
  icon: typeof FilePlus2
  label: string
  hint: string
  primary?: boolean
}) {
  return (
    <Link
      to={to}
      className={
        primary
          ? "group flex items-center gap-3 rounded-lg bg-primary px-4 py-3 text-white shadow-btn transition-[background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand hover:shadow-btn-hover active:translate-y-0"
          : "group flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-btn/30 hover:shadow-card active:translate-y-0"
      }
    >
      <Icon className={`size-[18px] flex-none ${primary ? "text-gold-light" : "text-brand"}`} strokeWidth={1.75} aria-hidden />
      <span className="grid flex-1">
        <span className="text-[14px] font-bold">{label}</span>
        <span className={`text-xs ${primary ? "text-white/80" : "text-muted-foreground"}`}>{hint}</span>
      </span>
      <ArrowLeft className={`size-4 transition-transform group-hover:-translate-x-1 duration-200 ${primary ? "text-white/80" : "text-faint"}`} aria-hidden />
    </Link>
  )
}

function StatusOverview({ stats, loading }: { stats: TicketStats; loading: boolean }) {
  const groups = [
    {
      title: "التصديق",
      rows: [
        { label: "تم التصديق", value: stats.approved, color: "var(--status-approved-dot)" },
        { label: "بانتظار التصديق", value: stats.pending, color: "var(--status-pending-dot)" },
      ],
    },
    {
      title: "مراجعة المبرمجين",
      rows: [
        { label: "تم تلافي الملاحظة", value: stats.resolved, color: "var(--status-resolved-dot)" },
        { label: "قيد الدراسة", value: stats.underStudy, color: "var(--status-study-dot)" },
        { label: "لم تتم المراجعة", value: stats.notReviewed, color: "var(--status-idle-dot)" },
      ],
    },
  ]

  return (
    <div className="grid gap-5 px-5 pb-5">
      {groups.map((group) => (
        <div key={group.title} className="grid gap-3">
          <p className="text-xs font-semibold text-muted-foreground">{group.title}</p>
          {group.rows.map((row) => {
            const ratio = stats.total ? row.value / stats.total : 0
            return (
              <div key={row.label} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="min-w-0 text-foreground">{row.label}</span>
                  {loading ? (
                    <Skeleton className="h-3.5 w-16" />
                  ) : (
                    <span className="flex shrink-0 items-baseline gap-2">
                      <span className="tabular font-bold text-foreground" dir="ltr" style={{ unicodeBidi: "isolate" }}>
                        {formatNumber(row.value)}
                      </span>
                      <span
                        className="tabular text-xs font-normal text-muted-foreground"
                        dir="ltr"
                        style={{ unicodeBidi: "isolate" }}
                      >
                        {formatPercent(ratio)}
                      </span>
                    </span>
                  )}
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-surface-soft"
                  role="meter"
                  aria-label={row.label}
                  aria-valuemin={0}
                  aria-valuemax={stats.total}
                  aria-valuenow={row.value}
                >
                  <div
                    className="h-full origin-right animate-bar rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${ratio * 100}%`, background: row.color, animationDelay: "250ms" }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
