import { useState } from "react"
import { ClipboardList, FilePlus2, Plus, SearchX } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { PageHeader, Panel } from "@/components/layout/PageHeader"
import { NoteFilters } from "@/components/notes/NoteFilters"
import { NotesTable } from "@/components/notes/NotesTable"
import { Button } from "@/components/ui/button"
import { hasActiveFilters } from "@/domain/stats"
import { useTicketList } from "@/hooks/useTickets"
import { useUrlFilters } from "@/hooks/useUrlFilters"
import { formatNumber } from "@/lib/format"
import { useAuth } from "@/services/auth/AuthProvider"

const PAGE_SIZE = 10

export function NotesPage() {
  const { can } = useAuth()
  const { filters, setFilters, clear } = useUrlFilters()
  const [page, setPage] = useState(1)
  const active = hasActiveFilters(filters)
  const canCreate = can("create")

  const { data, isLoading, error, refetch, isRefetching } = useTicketList({
    page,
    limit: PAGE_SIZE,
    q: filters.query,
    approval: filters.approval,
    devStatus: filters.devStatus,
    appId: filters.appId,
    from: filters.from,
    to: filters.to,
    sort: "createdAt",
    order: "desc",
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0

  return (
    <div className="grid gap-6">
      <PageHeader
        title="جميع الملاحظات"
        description="عرض وإدارة ومتابعة جميع الملاحظات المسجلة بالنظام."
        actions={
          canCreate ? (
            <Button asChild>
              <Link to="/notes/new">
                <Plus aria-hidden />
                إضافة ملاحظة جديدة
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error && <ErrorState error={error} onRetry={() => refetch()} retrying={isRefetching} />}

      <Panel className="overflow-hidden">
        <div className="border-b border-line-soft p-5">
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
          />
        </div>
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <p className="tabular text-[13px] text-muted-foreground" aria-live="polite">
            {isLoading ? "جارٍ التحميل…" : `${formatNumber(total)} ملاحظة${active ? " مطابقة" : " مسجلة"}`}
          </p>
        </div>
        <NotesTable
          tickets={items}
          pageSize={PAGE_SIZE}
          page={page}
          total={total}
          onPageChange={setPage}
          loading={isLoading}
          resetKey={JSON.stringify(filters)}
          empty={
            active ? (
              <EmptyState
                icon={SearchX}
                title="لا توجد ملاحظات مطابقة"
                description="جرّب تعديل كلمات البحث أو توسيع نطاق التاريخ أو مسح الفلاتر."
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
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="لا توجد ملاحظات مسجلة"
                description="عند تسجيل أول ملاحظة ستظهر هنا مع حالة التصديق ومراجعة المبرمجين."
                action={
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
            )
          }
        />
      </Panel>
    </div>
  )
}
