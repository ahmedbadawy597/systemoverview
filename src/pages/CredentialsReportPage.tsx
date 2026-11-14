import { useCallback, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
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
import { CredentialsPrintDocument } from "@/components/apps/CredentialsPrintDocument"
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

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve())
    })
  })
}

export function CredentialsReportPage() {
  const { canManageApps } = useAuth()
  const [q, setQ] = useState("")
  const [printGeneratedAt, setPrintGeneratedAt] = useState(() => new Date().toISOString())
  const [isPrinting, setIsPrinting] = useState(false)
  const printingRef = useRef(false)
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

  const loadingInterfaces = interfaceQueries.some((query) => query.isLoading)
  const interfacesError = interfaceQueries.find((query) => query.error)?.error
  const refreshing = appsQuery.isFetching || interfaceQueries.some((query) => query.isFetching)

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

  const printRows = useMemo(
    () =>
      filtered.map((r) => ({
        key: r.key,
        appName: r.appName,
        label: r.label,
        url: r.url,
        username: r.username,
        password: r.password,
      })),
    [filtered],
  )

  const handlePrint = useCallback(async () => {
    if (printingRef.current) return
    printingRef.current = true
    setIsPrinting(true)
    const stamp = new Date().toISOString()
    setPrintGeneratedAt(stamp)

    let fallbackTimer = 0
    const finish = () => {
      if (!printingRef.current) return
      printingRef.current = false
      setIsPrinting(false)
      window.removeEventListener("afterprint", finish)
      if (fallbackTimer) window.clearTimeout(fallbackTimer)
    }
    window.addEventListener("afterprint", finish)
    fallbackTimer = window.setTimeout(finish, 60_000)

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready
      }
      await waitForNextPaint()
      window.print()
    } catch {
      finish()
      toast.error("تعذّرت الطباعة. أعد المحاولة.")
    }
  }, [])

  if (!canManageApps) {
    return <PermissionEmpty permission="manageApps" title="تقرير بيانات الوصول للمساعد والمدير فقط" />
  }

  const loading = appsQuery.isLoading || (apps.length > 0 && loadingInterfaces)
  const appCount = apps.length
  const ifaceCount = rows.length

  return (
    <div className="grid gap-6">
      <PageHeader
        title="التقارير التفصيلية وسجلات النظام"
        description="جدول تفاعلي يعرض بيانات دخول الواجهات المسجّلة لكل تطبيق — للاستخدام الفني فقط."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={refreshing}
              onClick={() => {
                void appsQuery.refetch()
                interfaceQueries.forEach((query) => void query.refetch())
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
          title="تعذّر تحميل تقرير الوصول"
          error={appsQuery.error ?? interfacesError}
          onRetry={() => {
            void appsQuery.refetch()
            interfaceQueries.forEach((query) => void query.refetch())
          }}
          retrying={refreshing}
        />
      )}

      <Panel className="min-w-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid min-w-0 gap-1">
            <h2 className="font-heading text-[16px] font-bold text-foreground sm:text-[17px]">
              تقرير بيانات الوصول والحسابات للأنظمة
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {loading
                ? "جارٍ تجميع الواجهات…"
                : `${formatNumber(ifaceCount)} واجهة عبر ${formatNumber(appCount)} تطبيق`}
            </p>
            <p className="sr-only" aria-live="polite">
              تاريخ استخراج التقرير: {formatDateTime(printGeneratedAt)}
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
            <div className="relative w-full min-w-0 sm:max-w-[260px] sm:flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="تصفية التقرير…"
                className="ps-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                disabled={loading || !filtered.length}
                onClick={() => {
                  downloadCsv(filtered)
                  toast.success("تم تصدير التقرير (CSV)")
                }}
              >
                <FileSpreadsheet className="size-4" aria-hidden />
                تصدير (CSV)
              </Button>
              <Button className="w-full sm:w-auto" disabled={loading || isPrinting} onClick={() => void handlePrint()}>
                {isPrinting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Printer className="size-4" aria-hidden />
                )}
                طباعة التقرير
              </Button>
            </div>
          </div>
        </div>

        <div className="min-w-0 p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              جارٍ تحميل بيانات الواجهات…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 sm:p-8">
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
            <>
              {/* Mobile: stacked credential cards */}
              <ul className="grid gap-3 p-4 md:hidden">
                {filtered.map((row, index) => (
                  <li
                    key={row.key}
                    className="grid min-w-0 gap-3 rounded-xl border border-line bg-surface-soft/40 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid min-w-0 gap-1">
                        <p className="text-[11px] font-semibold text-muted-foreground">#{formatNumber(index + 1)}</p>
                        <Link
                          to={`/apps/${row.appId}/edit`}
                          className="truncate text-[14px] font-bold text-foreground hover:text-brand hover:underline"
                        >
                          {row.appName}
                        </Link>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-md px-2 py-1 text-[11px] font-bold ring-1 ring-inset",
                          roleTone(row.label),
                        )}
                      >
                        {row.label}
                      </span>
                    </div>

                    <dl className="grid gap-2 text-[12.5px]">
                      <div className="grid min-w-0 gap-0.5">
                        <dt className="text-muted-foreground">الرابط المخصص</dt>
                        <dd className="min-w-0 break-all font-mono text-[12px]" dir="ltr">
                          {row.url ? (
                            <a href={row.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                              {row.url}
                            </a>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="grid min-w-0 gap-0.5">
                          <dt className="text-muted-foreground">اسم المستخدم</dt>
                          <dd className="break-all font-mono text-[13px]" dir="ltr">
                            {row.username || "—"}
                          </dd>
                        </div>
                        <div className="grid min-w-0 gap-0.5">
                          <dt className="text-muted-foreground">كلمة المرور</dt>
                          <dd className="break-all font-mono text-[13px] font-semibold text-amber-800" dir="ltr">
                            {row.password || "—"}
                          </dd>
                        </div>
                      </div>
                    </dl>

                    {row.url ? (
                      <Button asChild size="sm" className="h-9 w-full">
                        <a href={row.url} target="_blank" rel="noreferrer">
                          انتقال
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>

              {/* Tablet/desktop: scrollable table */}
              <div className="hidden md:block">
                <Table className="min-w-[920px]">
                  <TableHeader>
                    <TableRow className="bg-surface-soft/70">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead className="min-w-[160px]">اسم التطبيق</TableHead>
                      <TableHead className="min-w-[120px]">الواجهة المستهدفة</TableHead>
                      <TableHead className="min-w-[220px]">الرابط المخصص</TableHead>
                      <TableHead className="min-w-[120px]">اسم المستخدم</TableHead>
                      <TableHead className="min-w-[120px]">كلمة المرور</TableHead>
                      <TableHead className="w-[100px] text-center">إجراء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row, index) => (
                      <TableRow key={row.key}>
                        <TableCell className="text-center tabular text-muted-foreground">
                          {formatNumber(index + 1)}
                        </TableCell>
                        <TableCell className="max-w-[220px] whitespace-normal font-semibold text-foreground">
                          <Link
                            to={`/apps/${row.appId}/edit`}
                            className="line-clamp-2 hover:text-brand hover:underline"
                          >
                            {row.appName}
                          </Link>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <span
                            className={cn(
                              "inline-flex max-w-full items-center rounded-md px-2 py-1 text-[11px] font-bold ring-1 ring-inset",
                              roleTone(row.label),
                            )}
                          >
                            {row.label}
                          </span>
                        </TableCell>
                        <TableCell
                          className="max-w-[280px] whitespace-normal break-all font-mono text-[12px]"
                          dir="ltr"
                        >
                          {row.url ? (
                            <a href={row.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                              {row.url}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[160px] whitespace-normal break-all font-mono text-[13px]" dir="ltr">
                          {row.username || "—"}
                        </TableCell>
                        <TableCell
                          className="max-w-[160px] whitespace-normal break-all font-mono text-[13px] font-semibold text-amber-800"
                          dir="ltr"
                        >
                          {row.password || "—"}
                        </TableCell>
                        <TableCell className="text-center">
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
              </div>
            </>
          )}
        </div>
      </Panel>

      {createPortal(
        <CredentialsPrintDocument
          rows={printRows}
          generatedAt={printGeneratedAt}
          appCount={appCount}
        />,
        document.body,
      )}
    </div>
  )
}
