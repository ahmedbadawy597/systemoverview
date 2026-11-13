import { useMemo, useState } from "react"
import {
  AlertTriangle,
  AppWindow,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Eye,
  Gauge,
  Grid2X2,
  KeyRound,
  Landmark,
  LayoutGrid,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { AppCredentialsDialog } from "@/components/apps/AppCredentialsDialog"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { PermissionEmpty } from "@/components/common/PermissionEmpty"
import { StatCard } from "@/components/common/StatCard"
import { PageHeader, Panel } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PUBLISH_STATUS_LABELS,
  type AppColor,
  type AppIcon,
  type AppPublishStatus,
  type WorkspaceApp,
} from "@/domain/app"
import {
  useAppsList,
  useAppsWorkspaceSummary,
  useDeleteApp,
  usePublishApp,
  useUnpublishApp,
} from "@/hooks/useApps"
import { formatNumber, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuth } from "@/services/auth/AuthProvider"
import type { AppStatusFilter } from "@/services/api/appsApi"

const COLOR_STYLES: Record<AppColor, { chip: string; bar: string; icon: string }> = {
  blue: {
    chip: "bg-[var(--status-study-bg)] text-[var(--status-study-ink)]",
    bar: "bg-[var(--status-study-dot)]",
    icon: "bg-[var(--status-study-bg)] text-[var(--status-study-ink)] ring-[var(--status-study-dot)]/20",
  },
  ok: {
    chip: "bg-[var(--status-resolved-bg)] text-[var(--status-resolved-ink)]",
    bar: "bg-[var(--status-resolved-dot)]",
    icon: "bg-[var(--status-resolved-bg)] text-[var(--status-resolved-ink)] ring-[var(--status-resolved-dot)]/20",
  },
  warn: {
    chip: "bg-[var(--status-pending-bg)] text-[var(--status-pending-ink)]",
    bar: "bg-gold",
    icon: "bg-[var(--status-pending-bg)] text-[var(--status-pending-ink)] ring-gold/20",
  },
  plum: {
    chip: "bg-[#f0e8f4] text-[#5a3a6a]",
    bar: "bg-[#7a4d8c]",
    icon: "bg-[#f0e8f4] text-[#5a3a6a] ring-[#7a4d8c]/20",
  },
}

const ICON_MAP: Record<AppIcon, typeof Gauge> = {
  kpi: Gauge,
  book: BookOpen,
  mosque: Landmark,
  move: ArrowUpRight,
  grid: Grid2X2,
}

function statusTone(status: AppPublishStatus) {
  if (status === "published") return "bg-[var(--status-resolved-bg)] text-[var(--status-resolved-ink)]"
  if (status === "draft") return "bg-[var(--status-pending-bg)] text-[var(--status-pending-ink)]"
  return "bg-[var(--status-idle-bg)] text-[var(--status-idle-ink)]"
}

function AppCard({
  app,
  busy,
  canManage,
  canPublish,
  onPublish,
  onUnpublish,
  onDelete,
  onOpenCredentials,
}: {
  app: WorkspaceApp
  busy: boolean
  canManage: boolean
  canPublish: boolean
  onPublish: () => void
  onUnpublish: () => void
  onDelete: () => void
  onOpenCredentials: () => void
}) {
  const Icon = ICON_MAP[app.icon] ?? LayoutGrid
  const tone = COLOR_STYLES[app.color] ?? COLOR_STYLES.blue
  const readiness = Math.min(100, Math.max(0, app.operationalReadinessPercent))

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-raised">
      <span className={cn("absolute inset-x-0 top-0 h-1", tone.bar)} aria-hidden />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "flex size-11 flex-none items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105",
                tone.icon,
              )}
            >
              <Icon className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-[16px] leading-relaxed font-bold text-foreground">{app.name}</h3>
                {app.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface-tint px-1.5 py-0.5 text-[11px] font-semibold text-brand">
                    <Star className="size-3 fill-current" aria-hidden />
                    مميز
                  </span>
                )}
              </div>
              <p className="line-clamp-2 text-[13px] leading-6 text-muted-foreground">
                {app.description || "لا يوجد وصف مختصر لهذا التطبيق."}
              </p>
            </div>
          </div>
          <span className={cn("shrink-0 rounded-md px-2 py-1 text-[11px] font-bold", statusTone(app.publishStatus))}>
            {PUBLISH_STATUS_LABELS[app.publishStatus]}
          </span>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>الجاهزية التشغيلية</span>
            <span className="font-semibold text-foreground tabular">{formatPercent(readiness / 100)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-soft">
            <div className={cn("h-full rounded-full transition-[width] duration-500", tone.bar)} style={{ width: `${readiness}%` }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className={cn("rounded-md px-2 py-1 font-semibold", tone.chip)}>{app.statusLabel}</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-soft px-2 py-1 font-medium text-muted-foreground">
            <Users className="size-3.5" aria-hidden />
            {formatNumber(app.usersCount)} مستخدم
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line-soft bg-surface-soft/50 px-4 py-3">
        <Button asChild size="sm" variant="outline" className="h-8">
          <a href={app.url} target="_blank" rel="noreferrer">
            <Eye className="size-3.5" aria-hidden />
            فتح
          </a>
        </Button>
        {canManage && (
          <>
            <Button size="sm" variant="outline" className="h-8" onClick={onOpenCredentials}>
              <KeyRound className="size-3.5" aria-hidden />
              واجهات
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8">
              <Link to={`/apps/${app.id}/edit`}>
                <Pencil className="size-3.5" aria-hidden />
                تعديل
              </Link>
            </Button>
            {canPublish &&
              (app.publishStatus === "published" ? (
                <Button size="sm" variant="ghost" className="h-8" disabled={busy} onClick={onUnpublish}>
                  إلغاء النشر
                </Button>
              ) : (
                <Button size="sm" className="h-8" disabled={busy} onClick={onPublish}>
                  نشر
                </Button>
              ))}
            <Button
              size="sm"
              variant="ghost"
              className="ms-auto h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" aria-hidden />
              حذف
            </Button>
          </>
        )}
      </div>
    </article>
  )
}

export function AppsPage() {
  const { canViewApps, canManageApps, canPublishApps } = useAuth()
  const [q, setQ] = useState("")
  /** Active lifecycle filters only — archive is not a supported UI workflow. */
  const [status, setStatus] = useState<"all" | "published" | "draft">("all")
  const [credentialsApp, setCredentialsApp] = useState<WorkspaceApp | null>(null)
  const query = useMemo(
    () => ({
      page: 1,
      limit: 50,
      q: q.trim() || undefined,
      status: canManageApps ? status : ("published" as AppStatusFilter),
    }),
    [q, status, canManageApps],
  )
  const listQuery = useAppsList(query, canViewApps)
  const summaryQuery = useAppsWorkspaceSummary(canViewApps)
  const publish = usePublishApp()
  const unpublish = useUnpublishApp()
  const remove = useDeleteApp()

  if (!canViewApps) {
    return <PermissionEmpty permission="view" title="عرض التطبيقات يتطلب تسجيل الدخول" />
  }

  const apps = listQuery.data?.items ?? []
  const summary = summaryQuery.data
  const busy = publish.isPending || unpublish.isPending || remove.isPending
  const statsLoading = summaryQuery.isLoading

  return (
    <div className="grid gap-6">
      <PageHeader
        title="منصة التطبيقات والمتابعة الفنية"
        description={
          canManageApps
            ? "إدارة تطبيقات التحول الرقمي، واجهات الدخول الفنية، ونشر البطاقات العامة في واجهة الوزير."
            : "استعراض التطبيقات المنشورة وفتحها مباشرة. التعديل والنشر للمساعد والمدير فقط."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {summary && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold",
                  summary.systemsHealthy
                    ? "bg-[var(--status-resolved-bg)] text-[var(--status-resolved-ink)]"
                    : "bg-[var(--status-pending-bg)] text-[var(--status-pending-ink)]",
                )}
              >
                {summary.systemsHealthy ? (
                  <CheckCircle2 className="size-3.5" aria-hidden />
                ) : (
                  <AlertTriangle className="size-3.5" aria-hidden />
                )}
                {summary.systemsHealthy ? "الأنظمة تعمل بكفاءة" : summary.alertsLabel}
              </span>
            )}
            <Button
              variant="outline"
              onClick={() => {
                void listQuery.refetch()
                void summaryQuery.refetch()
              }}
              disabled={listQuery.isFetching || summaryQuery.isFetching}
            >
              {listQuery.isFetching || summaryQuery.isFetching ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="size-4" aria-hidden />
              )}
              تحديث
            </Button>
            {canManageApps && (
              <>
                <Button asChild variant="outline">
                  <Link to="/apps/credentials">تقرير بيانات الوصول</Link>
                </Button>
                <Button asChild>
                  <Link to="/apps/new">
                    <Plus aria-hidden />
                    إضافة تطبيق
                  </Link>
                </Button>
              </>
            )}
          </div>
        }
      />

      {(listQuery.error || summaryQuery.error) && (
        <ErrorState
          title="تعذّر تحميل التطبيقات"
          error={listQuery.error ?? summaryQuery.error}
          onRetry={() => {
            void listQuery.refetch()
            void summaryQuery.refetch()
          }}
          retrying={listQuery.isFetching || summaryQuery.isFetching}
        />
      )}

      <div className="stagger grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي التطبيقات"
          value={summary?.totalApps ?? 0}
          subtitle="مسجّلة في المنظومة"
          icon={LayoutGrid}
          tone="brand"
          loading={statsLoading}
        />
        <StatCard
          label="الواجهات المتاحة"
          value={summary?.totalInterfaces ?? 0}
          subtitle={
            summary && summary.totalApps > 0
              ? `متوسط ${formatNumber(summary.avgInterfacesPerApp)} واجهة/تطبيق`
              : "واجهات دخول ديناميكية"
          }
          icon={KeyRound}
          tone="study"
          loading={statsLoading}
        />
        <StatCard
          label="نسبة الجاهزية الفنية"
          value={summary?.avgOperationalReadinessPercent ?? 0}
          subtitle="متوسط الجاهزية التشغيلية"
          icon={Gauge}
          tone="gold"
          loading={statsLoading}
        />
        <StatCard
          label="تنبيهات النظام"
          value={summary?.alertsCount ?? 0}
          subtitle={summary?.alertsLabel ?? "لا يوجد أعطال حالياً"}
          icon={summary?.systemsHealthy ? CheckCircle2 : AlertTriangle}
          tone={summary?.systemsHealthy === false ? "gold" : "resolved"}
          loading={statsLoading}
        />
      </div>

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-0.5">
            <h2 className="font-heading text-[17px] font-bold text-foreground">بطاقات التطبيقات</h2>
            <p className="text-[13px] text-muted-foreground">
              {canManageApps
                ? "ابحث وصفِّ حسب حالة النشر ثم عدّل أو انشر مباشرة."
                : "التطبيقات المنشورة المتاحة للفتح والاستخدام."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="بحث عن تطبيق…"
                className="ps-9"
              />
            </div>
            {canManageApps && (
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as "all" | "published" | "draft")}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="published">منشور</SelectItem>
                  <SelectItem value="draft">مسودة</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="p-5">
          {listQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-xl bg-surface-soft" />
              ))}
            </div>
          ) : apps.length === 0 ? (
            <EmptyState
              icon={AppWindow}
              title="لا توجد تطبيقات"
              description={
                q || (canManageApps && status !== "all")
                  ? "لا توجد نتائج مطابقة للبحث أو التصفية."
                  : canManageApps
                    ? "أضف أول تطبيق لمتابعة التحول الرقمي."
                    : "لا توجد تطبيقات منشورة حالياً."
              }
              action={
                canManageApps ? (
                  <Button asChild>
                    <Link to="/apps/new">
                      <Plus aria-hidden />
                      إضافة تطبيق جديد
                    </Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {apps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  busy={busy}
                  canManage={canManageApps}
                  canPublish={canPublishApps}
                  onPublish={() => publish.mutate(app.id)}
                  onUnpublish={() => unpublish.mutate(app.id)}
                  onOpenCredentials={() => setCredentialsApp(app)}
                  onDelete={() => {
                    if (!window.confirm(`حذف التطبيق «${app.name}»؟`)) return
                    remove.mutate(app.id, {
                      onSuccess: (r) => {
                        if (!r.ok) toast.error(r.error)
                      },
                    })
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </Panel>

      <AppCredentialsDialog
        appId={credentialsApp?.id ?? null}
        appName={credentialsApp?.name ?? ""}
        open={Boolean(credentialsApp)}
        onOpenChange={(open) => {
          if (!open) setCredentialsApp(null)
        }}
      />
    </div>
  )
}
