import { useMemo, useState } from "react"
import { BadgeCheck, ClipboardList, Eye, Hourglass, Printer, SearchCheck, SearchX, ShieldCheck } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader, Panel, PanelHeader } from "@/components/layout/PageHeader"
import { NoteFilters } from "@/components/notes/NoteFilters"
import { NotesTable } from "@/components/notes/NotesTable"
import { MonthlyChart } from "@/components/report/MonthlyChart"
import { describeScope, PrintReport } from "@/components/report/PrintReport"
import { usePrintReport } from "@/components/report/PrintReportProvider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { applyFilters, computeStats, hasActiveFilters } from "@/domain/stats"
import { useTickets } from "@/hooks/useTickets"
import { useUrlFilters } from "@/hooks/useUrlFilters"
import { formatNumber } from "@/lib/format"

export function ReportsPage() {
  const { data, isLoading, error, refetch, isRefetching } = useTickets()
  const { filters, setFilters, clear } = useUrlFilters()
  const { requestPrint } = usePrintReport()
  const [previewing, setPreviewing] = useState(false)
  const all = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters])
  const stats = useMemo(() => computeStats(filtered), [filtered])
  const share = (n: number) => (stats.total ? n / stats.total : 0)

  return (
    <div className="grid gap-6">
      <PageHeader
        title="التقارير"
        description="إحصاءات الملاحظات وإصدار تقرير رسمي قابل للطباعة بمقاس A4."
        actions={
          <>
            <Button variant="outline" onClick={() => setPreviewing(true)} disabled={isLoading}>
              <Eye aria-hidden />
              معاينة التقرير
            </Button>
            <Button onClick={() => requestPrint({ tickets: filtered, filters })} disabled={isLoading}>
              <Printer aria-hidden />
              طباعة التقرير
            </Button>
          </>
        }
      />

      {error && <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />}

      <Panel className="p-5">
        <NoteFilters filters={filters} onChange={setFilters} onClear={clear} fields={["dates", "approval", "devStatus"]} />
        <p className="mt-4 flex items-start gap-2 text-[13px] leading-6 text-muted-foreground">
          <ShieldCheck className="mt-1 size-4 flex-none text-gold" aria-hidden />
          <span>
            نطاق التقرير: <span className="text-foreground">{describeScope(filters)}</span>. تتطلب الطباعة كلمة مرور المدير.
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
            description="آخر ستة أشهر ضمن نطاق التقرير"
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
            <MonthlyChart tickets={filtered} />
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="الملاحظات المشمولة في التقرير"
            description={`${formatNumber(filtered.length)} ملاحظة${hasActiveFilters(filters) ? ` من ${formatNumber(all.length)}` : ""}`}
          />
          <NotesTable
            tickets={filtered}
            variant="compact"
            pageSize={6}
            loading={isLoading}
            resetKey={JSON.stringify(filters)}
            empty={
              <EmptyState
                icon={SearchX}
                title="لا توجد ملاحظات ضمن هذا النطاق"
                description="عدّل التاريخ أو الحالات لإظهار ملاحظات في التقرير."
                action={
                  <Button variant="outline" onClick={clear}>
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
              <DialogDescription>كما سيظهر عند الطباعة على ورق A4</DialogDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setPreviewing(false)
                requestPrint({ tickets: filtered, filters })
              }}
            >
              <Printer aria-hidden />
              طباعة
            </Button>
          </DialogHeader>
          <div className="overflow-y-auto bg-[#e9eeeb] p-4 sm:p-8" style={{ maxHeight: "calc(92dvh - 80px)" }}>
            <div className="mx-auto w-full max-w-[210mm] bg-white p-[8mm] shadow-float sm:p-[14mm]">
              <PrintReport tickets={filtered} filters={filters} generatedAt={new Date().toISOString()} includeImages={false} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
