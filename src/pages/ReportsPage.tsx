import { useEffect, useState } from "react"
import { BadgeCheck, ClipboardList, Eye, Hourglass, Loader2, Printer, SearchCheck, SearchX, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader, Panel, PanelHeader } from "@/components/layout/PageHeader"
import { NoteFilters } from "@/components/notes/NoteFilters"
import { NotesTable } from "@/components/notes/NotesTable"
import { MonthlyChart } from "@/components/report/MonthlyChart"
import { describeScope } from "@/components/report/PrintReport"
import { usePrintReport } from "@/components/report/PrintReportProvider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PermissionEmpty } from "@/components/common/PermissionEmpty"
import { hasActiveFilters } from "@/domain/stats"
import { useTicketList, useTicketStats } from "@/hooks/useTickets"
import { useUrlFilters } from "@/hooks/useUrlFilters"
import { formatNumber } from "@/lib/format"
import { reportsApi } from "@/services/api/reportsApi"
import { useAuth } from "@/services/auth/AuthProvider"

const PAGE_SIZE = 6

export function ReportsPage() {
  const { can } = useAuth()
  const allowed = can("print")
  const { filters, setFilters, clear } = useUrlFilters()
  const { requestPrint } = usePrintReport()
  const [previewing, setPreviewing] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!previewing) {
      setPreviewHtml(null)
      return
    }
    let cancelled = false
    setPreviewLoading(true)
    void reportsApi
      .previewNotesHtml(filters, false)
      .then((result) => {
        if (!cancelled) setPreviewHtml(result.html)
      })
      .catch((error) => {
        if (!cancelled) {
          setPreviewing(false)
          toast.error("تعذّر معاينة التقرير", {
            description: error instanceof Error ? error.message : undefined,
          })
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [previewing, filters])

  const filterQuery = {
    q: filters.query,
    approval: filters.approval,
    devStatus: filters.devStatus,
    from: filters.from,
    to: filters.to,
  }

  const statsQuery = useTicketStats(filters, allowed)
  const listQuery = useTicketList(
    {
      page,
      limit: PAGE_SIZE,
      ...filterQuery,
      sort: "createdAt",
      order: "desc",
    },
    allowed,
  )
  const chartQuery = useTicketList(
    {
      page: 1,
      limit: 100,
      ...filterQuery,
      sort: "createdAt",
      order: "desc",
    },
    allowed,
  )

  const stats = statsQuery.data ?? { total: 0, pending: 0, approved: 0, notReviewed: 0, underStudy: 0, resolved: 0 }
  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const chartTickets = chartQuery.data?.items ?? []
  const isLoading = statsQuery.isLoading || listQuery.isLoading
  const error = statsQuery.error || listQuery.error
  const share = (n: number) => (stats.total ? n / stats.total : 0)

  if (!allowed) {
    return (
      <div className="grid gap-6">
        <PageHeader title="التقارير" description="إحصاءات الملاحظات وإصدار تقرير رسمي من الخادم." />
        <PermissionEmpty permission="print" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="التقارير"
        description="إحصاءات الملاحظات وإصدار تقرير رسمي من الخادم."
        actions={
          <>
            <Button variant="outline" onClick={() => setPreviewing(true)} disabled={isLoading}>
              <Eye aria-hidden />
              معاينة التقرير
            </Button>
            <Button onClick={() => requestPrint({ filters })} disabled={isLoading}>
              <Printer aria-hidden />
              طباعة التقرير
            </Button>
          </>
        }
      />

      {error && (
        <ErrorState
          error={error}
          onRetry={() => {
            void statsQuery.refetch()
            void listQuery.refetch()
            void chartQuery.refetch()
          }}
          retrying={statsQuery.isRefetching || listQuery.isRefetching}
        />
      )}

      <Panel className="p-5">
        <NoteFilters
          filters={filters}
          onChange={(patch) => {
            setFilters(patch)
            setPage(1)
          }}
          onClear={() => {
            clear()
            setPage(1)
          }}
          fields={["dates", "approval", "devStatus"]}
        />
        <p className="mt-4 flex items-start gap-2 text-[13px] leading-6 text-muted-foreground">
          <ShieldCheck className="mt-1 size-4 flex-none text-gold" aria-hidden />
          <span>
            نطاق التقرير: <span className="text-foreground">{describeScope(filters)}</span>. الطباعة الرسمية تتم عبر الخادم لمن لديه صلاحية التقارير.
          </span>
        </p>
      </Panel>

      <div className="stagger grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="إجمالي الملاحظات" value={stats.total} subtitle="ضمن نطاق التقرير" icon={ClipboardList} loading={isLoading} />
        <StatCard label="الملاحظات المصدقة" value={stats.approved} share={share(stats.approved)} subtitle="من الإجمالي" icon={BadgeCheck} tone="resolved" loading={isLoading} />
        <StatCard label="بانتظار التصديق" value={stats.pending} share={share(stats.pending)} subtitle="من الإجمالي" icon={Hourglass} tone="gold" loading={isLoading} />
        <StatCard label="قيد الدراسة" value={stats.underStudy} share={share(stats.underStudy)} subtitle="لدى المبرمجين" icon={SearchCheck} tone="study" loading={isLoading} />
        <StatCard label="تم تلافيها" value={stats.resolved} share={share(stats.resolved)} subtitle="معالجة نهائيًا" icon={BadgeCheck} tone="brand" loading={isLoading} />
      </div>

      <div className="grid items-start gap-6 2xl:grid-cols-[400px_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title="الملاحظات المضافة شهريًا"
            description="حتى ١٠٠ ملاحظة ضمن النطاق للرسم البياني"
            actions={
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-brand" aria-hidden />
                  مصدقة
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-gold-light" aria-hidden />
                  بانتظار التصديق
                </span>
              </div>
            }
          />
          <div className="px-4 pb-5">
            <MonthlyChart tickets={chartTickets} />
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="الملاحظات المشمولة في التقرير"
            description={`${formatNumber(total)} ملاحظة${hasActiveFilters(filters) ? " ضمن النطاق" : ""}`}
          />
          <NotesTable
            tickets={items}
            variant="compact"
            pageSize={PAGE_SIZE}
            page={page}
            total={total}
            onPageChange={setPage}
            loading={listQuery.isLoading}
            resetKey={JSON.stringify(filters)}
            empty={
              <EmptyState
                icon={SearchX}
                title="لا توجد ملاحظات ضمن هذا النطاق"
                description="عدّل التاريخ أو الحالات لإظهار ملاحظات في التقرير."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      clear()
                      setPage(1)
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                }
              />
            }
          />
        </Panel>
      </div>

      <Dialog open={previewing} onOpenChange={setPreviewing}>
        <DialogContent className="max-h-[92dvh] gap-0 overflow-hidden p-0 sm:max-w-[880px]">
          <DialogHeader className="flex-row items-center justify-between gap-4 border-b border-line-soft px-6 py-4 pe-14">
            <div className="grid gap-0.5">
              <DialogTitle>معاينة تقرير الملاحظات</DialogTitle>
              <DialogDescription>معاينة رسمية من الخادم — نفس محتوى ملف PDF</DialogDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setPreviewing(false)
                requestPrint({ filters })
              }}
              disabled={previewLoading}
            >
              <Printer aria-hidden />
              طباعة
            </Button>
          </DialogHeader>
          <div className="overflow-y-auto bg-[#e9eeeb] p-4 sm:p-8" style={{ maxHeight: "calc(92dvh - 80px)" }}>
            {previewLoading || !previewHtml ? (
              <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden />
                جارٍ تجهيز المعاينة من الخادم…
              </div>
            ) : (
              <iframe
                title="معاينة تقرير الملاحظات"
                srcDoc={previewHtml}
                className="mx-auto block h-[70vh] w-full max-w-[210mm] rounded-md border border-line bg-white shadow-float"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
