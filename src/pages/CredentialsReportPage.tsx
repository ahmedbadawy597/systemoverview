import { useMemo, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import {
  ExternalLink,
  FileSpreadsheet,
  KeyRound,
  Loader2,
  Printer,
  RefreshCw,
  Search,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { PermissionEmpty } from "@/components/common/PermissionEmpty"
import { PageHeader, Panel } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AppInterface, WorkspaceApp } from "@/domain/app"
import { APPS_KEY, useAppsList } from "@/hooks/useApps"
import { formatDateTime, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { appsApi } from "@/services/api/appsApi"
import { useAuth } from "@/services/auth/AuthProvider"

type CredRow = {
  key: string
  appId: string
  appName: string
  label: string
  url: string
  username: string
  password: string
}

function roleTone(label: string) {
  const t = label.trim()
  if (/وزير|معالي/.test(t)) return "bg-amber-100 text-amber-900 ring-amber-200"
  if (/مسؤول|admin|إدارة|مدير/i.test(t)) return "bg-sky-100 text-sky-900 ring-sky-200"
  return "bg-slate-100 text-slate-700 ring-slate-200"
}

function csvEscape(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

function downloadCsv(rows: CredRow[]) {
  const header = ["اسم التطبيق", "الواجهة المستهدفة", "الرابط المخصص", "اسم المستخدم", "كلمة المرور"]
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.appName, r.label, r.url, r.username, r.password].map(csvEscape).join(","),
    ),
  ]
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `تقرير_بيانات_الوصول_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function CredentialsReportPage() {
  const { canManageApps } = useAuth()
  const [q, setQ] = useState("")
  const appsQuery = useAppsList({ page: 1, limit: 100, status: "all" }, canManageApps)
  const apps = appsQuery.data?.items ?? []

  const interfaceQueries = useQueries({
    queries: apps.map((app) => ({
      queryKey: [...APPS_KEY, "interfaces", app.id] as const,
      queryFn: () => appsApi.listInterfaces(app.id),
      enabled: canManageApps && apps.length > 0,
      staleTime: 15_000,
    })),
  })

  const loadingInterfaces = interfaceQueries.some((q) => q.isLoading)
  const interfacesError = interfaceQueries.find((q) => q.error)?.error
  const refreshing = appsQuery.isFetching || interfaceQueries.some((q) => q.isFetching)

  const rows = useMemo(() => {
    const out: CredRow[] = []
    apps.forEach((app: WorkspaceApp, index) => {
      const list = (interfaceQueries[index]?.data ?? []) as AppInterface[]
      for (const iface of list) {
        out.push({
          key: `${app.id}:${iface.id}`,
          appId: app.id,
          appName: app.name,
          label: iface.label,
          url: iface.url ?? "",
          username: iface.username ?? "",
          password: iface.password ?? "",
        })
      }
    })
    return out
  }, [apps, interfaceQueries])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(
      (r) =>
        r.appName.toLowerCase().includes(query) ||
        r.label.toLowerCase().includes(query) ||
        r.username.toLowerCase().includes(query) ||
        r.url.toLowerCase().includes(query),
    )
  }, [rows, q])

  if (!canManageApps) {
    return <PermissionEmpty permission="manageApps" title="تقرير بيانات الوصول للمساعد والمدير فقط" />
  }

  const loading = appsQuery.isLoading || (apps.length > 0 && loadingInterfaces)
  const appCount = apps.length
  const ifaceCount = rows.length

  return (
    <div className="grid gap-6 print:gap-3">
      <PageHeader
        className="print:hidden"
        title="التقارير التفصيلية وسجلات النظام"
        description="جدول تفاعلي يعرض بيانات دخول الواجهات المسجّلة لكل تطبيق — للاستخدام الفني فقط."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={refreshing}
              onClick={() => {
                void appsQuery.refetch()
                interfaceQueries.forEach((q) => void q.refetch())
              }}
            >
              {refreshing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
              تحديث
            </Button>
            <Button asChild variant="outline">
              <Link to="/apps">العودة للتطبيقات</Link>
            </Button>
          </div>
        }
      />

      {(appsQuery.error || interfacesError) && (
        <ErrorState
          className="print:hidden"
          title="تعذّر تحميل تقرير الوصول"
          error={appsQuery.error ?? interfacesError}
          onRetry={() => {
            void appsQuery.refetch()
            interfaceQueries.forEach((q) => void q.refetch())
          }}
          retrying={refreshing}
        />
      )}

      <Panel className="overflow-hidden print:border-0 print:shadow-none">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 print:border-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <h2 className="font-heading text-[17px] font-bold text-foreground">
              تقرير بيانات الوصول والحسابات للأنظمة
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {loading
                ? "جارٍ تجميع الواجهات…"
                : `${formatNumber(ifaceCount)} واجهة عبر ${formatNumber(appCount)} تطبيق`}
            </p>
            <p className="hidden text-[12px] text-muted-foreground print:block" id="print-date-stamp">
              تاريخ استخراج التقرير: {formatDateTime(new Date().toISOString())}
            </p>
          </div>

          <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:items-center">
            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="تصفية التقرير…"
                className="ps-9"
              />
            </div>
            <Button
              variant="outline"
              disabled={!filtered.length}
              onClick={() => {
                downloadCsv(filtered)
                toast.success("تم تصدير التقرير (CSV)")
              }}
            >
              <FileSpreadsheet className="size-4" aria-hidden />
              تصدير (CSV)
            </Button>
            <Button
              disabled={!filtered.length}
              onClick={() => {
                window.print()
              }}
            >
              <Printer className="size-4" aria-hidden />
              طباعة التقرير
            </Button>
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              جارٍ تحميل بيانات الواجهات…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={KeyRound}
                title={q ? "لا توجد نتائج للتصفية" : "لا توجد واجهات مسجّلة"}
                description={
                  q
                    ? "جرّب كلمة بحث أخرى أو امسح التصفية."
                    : "أضف واجهات دخول من صفحة تعديل التطبيق لتظهر هنا."
                }
                action={
                  <Button asChild variant="outline">
                    <Link to="/apps">إدارة التطبيقات</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-soft/70">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>اسم التطبيق</TableHead>
                  <TableHead>الواجهة المستهدفة</TableHead>
                  <TableHead>الرابط المخصص</TableHead>
                  <TableHead>اسم المستخدم</TableHead>
                  <TableHead>كلمة المرور</TableHead>
                  <TableHead className="print:hidden text-center">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row, index) => (
                  <TableRow key={row.key}>
                    <TableCell className="text-center tabular text-muted-foreground">{formatNumber(index + 1)}</TableCell>
                    <TableCell className="font-semibold text-foreground">
                      <Link to={`/apps/${row.appId}/edit`} className="hover:text-brand hover:underline print:no-underline print:text-foreground">
                        {row.appName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-2 py-1 text-[11px] font-bold ring-1 ring-inset",
                          roleTone(row.label),
                        )}
                      >
                        {row.label}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[220px] break-all font-mono text-[12px]" dir="ltr">
                      {row.url ? (
                        <a href={row.url} target="_blank" rel="noreferrer" className="text-brand hover:underline print:text-foreground">
                          {row.url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[13px]" dir="ltr">
                      {row.username || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-[13px] font-semibold text-amber-800" dir="ltr">
                      {row.password || "—"}
                    </TableCell>
                    <TableCell className="print:hidden text-center">
                      {row.url ? (
                        <Button asChild size="sm" className="h-8">
                          <a href={row.url} target="_blank" rel="noreferrer">
                            انتقال
                            <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Panel>

      <p className="hidden text-center text-[11px] text-muted-foreground print:block">
        مشروع التحول الرقمي — تقرير بيانات الحسابات والروابط المخصصة (سري — للاستخدام الداخلي)
      </p>
    </div>
  )
}
