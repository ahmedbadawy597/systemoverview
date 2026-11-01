import { useMemo } from "react"
import { ClipboardList, FilePlus2, Plus, SearchX } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { PageHeader, Panel } from "@/components/layout/PageHeader"
import { NoteFilters } from "@/components/notes/NoteFilters"
import { NotesTable } from "@/components/notes/NotesTable"
import { Button } from "@/components/ui/button"
import { applyFilters, hasActiveFilters } from "@/domain/stats"
import { useTickets } from "@/hooks/useTickets"
import { useUrlFilters } from "@/hooks/useUrlFilters"
import { formatNumber } from "@/lib/format"

export function NotesPage() {
  const { data, isLoading, error, refetch, isRefetching } = useTickets()
  const { filters, setFilters, clear } = useUrlFilters()
  const all = useMemo(() => data ?? [], [data])
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters])
  const active = hasActiveFilters(filters)

  return (
    <div className="grid gap-6">
      <PageHeader
        title="جميع الملاحظات"
        description="عرض وإدارة ومتابعة جميع الملاحظات المسجلة بالنظام."
        actions={
          <Button asChild>
            <Link to="/notes/new">
              <Plus aria-hidden />
              إضافة ملاحظة جديدة
            </Link>
          </Button>
        }
      />

      {error && <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />}

      <Panel className="overflow-hidden">
        <div className="border-b border-line-soft p-5">
          <NoteFilters filters={filters} onChange={setFilters} onClear={clear} />
        </div>
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <p className="tabular text-[13px] text-muted-foreground" aria-live="polite">
            {isLoading
              ? "جارٍ التحميل…"
              : active
                ? `${formatNumber(filtered.length)} نتيجة من ${formatNumber(all.length)} ملاحظة`
                : `${formatNumber(all.length)} ملاحظة مسجلة`}
          </p>
        </div>
        <NotesTable
          tickets={filtered}
          pageSize={10}
          loading={isLoading}
          resetKey={JSON.stringify(filters)}
          empty={
            active ? (
              <EmptyState
                icon={SearchX}
                title="لا توجد ملاحظات مطابقة"
                description="جرّب تعديل كلمات البحث أو توسيع نطاق التاريخ أو مسح الفلاتر."
                action={
                  <Button variant="outline" onClick={clear}>
                    مسح الفلاتر
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="لا توجد ملاحظات مسجلة"
                description="عند تسجيل أول ملاحظة ستظهر هنا مع حالة التصديق ومراجعة المبرمجين."
                action={
                  <Button asChild>
                    <Link to="/notes/new">
                      <FilePlus2 aria-hidden />
                      إضافة ملاحظة
                    </Link>
                  </Button>
                }
              />
            )
          }
        />
      </Panel>
    </div>
  )
}
