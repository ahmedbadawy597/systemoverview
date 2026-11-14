import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { ArrowRight, FileQuestion, Laptop, Loader2, Pencil, Save } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { AppInterfacesEditor, draftsFromInterfaces } from "@/components/apps/AppInterfacesEditor"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import { PermissionEmpty } from "@/components/common/PermissionEmpty"
import { PageHeader, Panel } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  APP_COLORS,
  APP_ICONS,
  APP_STATUS_LABELS,
  type AppColor,
  type AppIcon,
  type AppInterfaceDraft,
  type AppStatusLabel,
} from "@/domain/app"
import { useApp, useAppInterfaces, useCreateApp, useReplaceAppInterfaces, useUpdateApp } from "@/hooks/useApps"
import { focusFirstFormError, mapApiDetailsToFormErrors } from "@/lib/apiFieldErrors"
import { MAX_APP_USERS_COUNT, parseStrictInteger } from "@/lib/appLimits"
import { formatNumber } from "@/lib/format"
import { appsApi, type AppMutateResult, type DuplicateCheckResult } from "@/services/api/appsApi"
import { useAuth } from "@/services/auth/AuthProvider"

interface Draft {
  name: string
  description: string
  url: string
  color: AppColor
  icon: AppIcon
  statusLabel: AppStatusLabel
  usersCount: string
  operationalReadinessPercent: string
  isFeatured: boolean
  sortOrder: string
  publishNow: boolean
}

type FormErrorKey = keyof Draft | "interfaces" | "form"

const EMPTY: Draft = {
  name: "",
  description: "",
  url: "",
  color: "blue",
  icon: "grid",
  statusLabel: "جديد",
  usersCount: "0",
  operationalReadinessPercent: "0",
  isFeatured: false,
  sortOrder: "0",
  publishNow: false,
}

export function AppFormPage() {
  const { canManageApps, canPublishApps } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const appQuery = useApp(id, canManageApps && isEdit)
  const interfacesQuery = useAppInterfaces(id, canManageApps && isEdit)
  const create = useCreateApp()
  const update = useUpdateApp()
  const replaceInterfaces = useReplaceAppInterfaces()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [interfaces, setInterfaces] = useState<AppInterfaceDraft[]>([])
  const [errors, setErrors] = useState<Partial<Record<FormErrorKey, string>>>({})
  const [duplicate, setDuplicate] = useState<DuplicateCheckResult | null>(null)
  const dupTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!appQuery.data) return
    const app = appQuery.data
    setDraft({
      name: app.name,
      description: app.description ?? "",
      url: app.url,
      color: app.color,
      icon: app.icon,
      statusLabel: app.statusLabel,
      usersCount: String(app.usersCount),
      operationalReadinessPercent: String(app.operationalReadinessPercent),
      isFeatured: app.isFeatured,
      sortOrder: String(app.sortOrder),
      publishNow: false,
    })
  }, [appQuery.data])

  useEffect(() => {
    if (!interfacesQuery.data) return
    setInterfaces(draftsFromInterfaces(interfacesQuery.data))
  }, [interfacesQuery.data])

  useEffect(() => {
    if (dupTimer.current) clearTimeout(dupTimer.current)
    const name = draft.name.trim()
    const url = draft.url.trim()
    if (!name && !url) {
      setDuplicate(null)
      return
    }
    dupTimer.current = setTimeout(() => {
      void appsApi
        .checkDuplicate({ name: name || undefined, url: url || undefined, excludeId: id })
        .then(setDuplicate)
        .catch(() => setDuplicate(null))
    }, 400)
    return () => {
      if (dupTimer.current) clearTimeout(dupTimer.current)
    }
  }, [draft.name, draft.url, id])

  const saving = create.isPending || update.isPending || replaceInterfaces.isPending
  const title = useMemo(() => (isEdit ? "تعديل التطبيق" : "إضافة تطبيق جديد"), [isEdit])

  if (!canManageApps) {
    return <PermissionEmpty permission="manageApps" title="إنشاء التطبيقات للمساعد والمدير فقط" />
  }

  if (isEdit && (appQuery.isLoading || interfacesQuery.isLoading)) {
    return (
      <div className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        جارٍ تحميل التطبيق…
      </div>
    )
  }

  if (isEdit && appQuery.error) {
    return <ErrorState error={appQuery.error} onRetry={() => void appQuery.refetch()} retrying={appQuery.isFetching} />
  }

  if (isEdit && !appQuery.data) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="التطبيق غير موجود"
        description="قد يكون حُذف أو أن الرابط غير صحيح."
        action={
          <Button asChild variant="outline">
            <Link to="/apps">العودة للتطبيقات</Link>
          </Button>
        }
      />
    )
  }

  function validate(next: Draft, nextInterfaces: AppInterfaceDraft[]) {
    const nextErrors: Partial<Record<FormErrorKey, string>> = {}
    if (!next.name.trim()) nextErrors.name = "يرجى إدخال اسم التطبيق بشكل صحيح"
    if (!next.url.trim()) nextErrors.url = "رابط التطبيق مطلوب"
    else {
      try {
        const u = new URL(next.url.trim())
        if (u.protocol !== "http:" && u.protocol !== "https:") nextErrors.url = "الرابط يجب أن يبدأ بـ http أو https"
      } catch {
        nextErrors.url = "رابط غير صالح"
      }
    }
    const users = parseStrictInteger(next.usersCount)
    if (users === null || users < 0 || users > MAX_APP_USERS_COUNT) {
      nextErrors.usersCount = "يرجى إدخال عدد صحيح للمستخدمين"
    }

    const ready = parseStrictInteger(next.operationalReadinessPercent)
    if (ready === null || ready < 0 || ready > 100) {
      nextErrors.operationalReadinessPercent = "يرجى إدخال نسبة جاهزية صحيحة بين 0 و100"
    }

    const sort = parseStrictInteger(next.sortOrder)
    if (sort === null) {
      nextErrors.sortOrder = "يرجى إدخال رقم صحيح لترتيب العرض"
    }
    const blankLabel = nextInterfaces.some((row) => !row.label.trim())
    if (blankLabel) nextErrors.interfaces = "كل واجهة تحتاج مسمّى / دورًا"
    if (nextInterfaces.length > 50) nextErrors.interfaces = "الحد الأقصى ٥٠ واجهة لكل تطبيق"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      queueMicrotask(() => focusFirstFormError(nextErrors as Record<string, string>))
    }
    return Object.keys(nextErrors).length === 0
  }

  function applyApiFailure(result: Extract<AppMutateResult, { ok: false }>) {
    if (result.existing) {
      setDuplicate({
        id: result.existing.id,
        name: result.existing.name,
        url: result.existing.url,
        matchedBy: result.existing.matchedBy,
      })
      return
    }

    const { fieldErrors, unmapped } = mapApiDetailsToFormErrors(result.fieldErrors)
    const nextErrors: Partial<Record<FormErrorKey, string>> = {
      ...(fieldErrors as Partial<Record<FormErrorKey, string>>),
    }
    if (!Object.keys(fieldErrors).length) {
      nextErrors.form = result.error || unmapped[0] || "تعذّر حفظ التطبيق. حاول مرة أخرى."
    } else if (unmapped.length) {
      nextErrors.form = unmapped[0]
    }
    setErrors(nextErrors)
    queueMicrotask(() => focusFirstFormError(nextErrors as Record<string, string>))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    if (!validate(draft, interfaces)) return

    const usersCount = parseStrictInteger(draft.usersCount)
    const operationalReadinessPercent = parseStrictInteger(draft.operationalReadinessPercent)
    const sortOrder = parseStrictInteger(draft.sortOrder)
    if (usersCount === null || operationalReadinessPercent === null || sortOrder === null) {
      return
    }

    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      url: draft.url.trim(),
      color: draft.color,
      icon: draft.icon,
      statusLabel: draft.statusLabel,
      usersCount,
      operationalReadinessPercent,
      isFeatured: draft.isFeatured,
      sortOrder,
    }

    if (isEdit && id) {
      const result = await update.mutateAsync({ id, input: payload })
      if (!result.ok) {
        applyApiFailure(result)
        return
      }
      const ifaceResult = await replaceInterfaces.mutateAsync({ appId: id, drafts: interfaces })
      if (!ifaceResult.ok) {
        toast.error(ifaceResult.error)
        return
      }
      navigate("/apps")
      return
    }

    const result = await create.mutateAsync({
      ...payload,
      publishNow: canPublishApps && draft.publishNow,
    })
    if (!result.ok) {
      applyApiFailure(result)
      return
    }
    if (interfaces.length) {
      const ifaceResult = await replaceInterfaces.mutateAsync({
        appId: result.app.id,
        drafts: interfaces,
      })
      if (!ifaceResult.ok) {
        toast.error(ifaceResult.error)
        navigate(`/apps/${result.app.id}/edit`)
        return
      }
    }
    navigate("/apps")
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      if (!prev[key] && !prev.form) return prev
      const next = { ...prev }
      delete next[key]
      delete next.form
      return next
    })
  }

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-3xl gap-6">
      <PageHeader
        title={title}
        description="عبّئ بيانات التطبيق وواجهات الدخول الفنية، ثم احفظ كمسودة أو انشر لواجهة الوزير (بدون كلمات المرور)."
        actions={
          <Button asChild variant="outline">
            <Link to="/apps">
              <ArrowRight aria-hidden />
              العودة للتطبيقات
            </Link>
          </Button>
        }
      />

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-line bg-primary px-5 py-5 text-primary-foreground">
          <div className="grid gap-1">
            <h2 className="font-heading text-[17px] font-bold">{isEdit ? "تعديل بيانات التطبيق" : "بيانات التطبيق الجديد"}</h2>
            <p className="text-[13px] text-primary-foreground/75">الحقول المعلّمة مطلوبة لإتمام الحفظ.</p>
          </div>
          <Laptop className="size-8 opacity-80" aria-hidden />
        </div>

        <form onSubmit={onSubmit} className="grid gap-6 p-5 sm:p-6" noValidate>
          {errors.form && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
              {errors.form}
            </p>
          )}

          {duplicate && duplicate.id !== id && (
            <aside
              role="status"
              className="grid gap-3 rounded-xl border border-[#e8d7a8] bg-gradient-to-b from-[#fffdf6] to-[#fff8e8] p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <span className="flex size-9 items-center justify-center rounded-[10px] border border-[#e8d7a8] bg-[#f5ebc8] text-[#9a7418]">
                <Pencil className="size-4" aria-hidden />
              </span>
              <div className="grid gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-bold text-[#6b5210]">تطبيق مسجّل مسبقًا</p>
                  <span className="rounded-full border border-[#e4d19a] bg-[#f3e6bc] px-2 py-0.5 text-[11px] font-bold text-[#7a5b12]">
                    {duplicate.matchedBy === "url" ? "تطابق الرابط" : "تطابق الاسم"}
                  </span>
                </div>
                <p className="text-[13px] leading-6 text-[#7a5b12]/90">
                  «{duplicate.name}» موجود بالفعل. عدّل السجل الحالي بدل إنشاء نسخة مكررة.
                </p>
              </div>
              <Button
                type="button"
                className="bg-[#8a6a16] hover:bg-[#6f5512]"
                onClick={() => navigate(`/apps/${duplicate.id}/edit`)}
              >
                <Pencil className="size-3.5" aria-hidden />
                تعديل التطبيق الحالي
              </Button>
            </aside>
          )}

          <section className="grid gap-4">
            <h3 className="border-b border-line pb-2 text-[14px] font-bold text-foreground">البيانات الأساسية</h3>

            <div className="grid gap-2">
              <Label htmlFor="app-name">
                اسم التطبيق / المنظومة <span className="text-destructive">*</span>
              </Label>
              <Input
                id="app-name"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="مثال: منظومة الموارد البشرية الذكية"
                aria-invalid={Boolean(errors.name)}
                maxLength={90}
              />
              {errors.name && <p className="text-[12px] text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="app-description">نبذة مختصرة والغرض من التطبيق</Label>
              <Textarea
                id="app-description"
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="اكتب شرحًا موجزًا لوظائف التطبيق والفئة المستهدفة…"
                maxLength={220}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="app-url">
                رابط التطبيق <span className="text-destructive">*</span>
              </Label>
              <Input
                id="app-url"
                dir="ltr"
                className="text-start"
                value={draft.url}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://example.strategizeit.us"
                aria-invalid={Boolean(errors.url)}
              />
              {errors.url && <p className="text-[12px] text-destructive">{errors.url}</p>}
            </div>
          </section>

          <section className="grid gap-4">
            <h3 className="border-b border-line pb-2 text-[14px] font-bold text-foreground">المظهر والحالة</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>لون البطاقة</Label>
                <Select value={draft.color} onValueChange={(v) => set("color", v as AppColor)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>الأيقونة</Label>
                <Select value={draft.icon} onValueChange={(v) => set("icon", v as AppIcon)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_ICONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>تسمية الحالة</Label>
                <Select value={draft.statusLabel} onValueChange={(v) => set("statusLabel", v as AppStatusLabel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_STATUS_LABELS.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="app-users">
                  عدد المستخدمين <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="app-users"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  dir="ltr"
                  className="text-start tabular"
                  value={draft.usersCount}
                  onChange={(e) => set("usersCount", e.target.value)}
                  aria-invalid={Boolean(errors.usersCount)}
                  aria-describedby={errors.usersCount ? "app-users-error" : "app-users-hint"}
                />
                {errors.usersCount ? (
                  <p id="app-users-error" className="text-[12px] text-destructive">
                    {errors.usersCount}
                  </p>
                ) : (
                  <p id="app-users-hint" className="text-[11px] text-muted-foreground">
                    عدد صحيح من ٠ إلى {formatNumber(MAX_APP_USERS_COUNT)}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="app-ready">الجاهزية التشغيلية %</Label>
                <Input
                  id="app-ready"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  dir="ltr"
                  className="text-start tabular"
                  value={draft.operationalReadinessPercent}
                  onChange={(e) => set("operationalReadinessPercent", e.target.value)}
                  aria-invalid={Boolean(errors.operationalReadinessPercent)}
                  aria-describedby={
                    errors.operationalReadinessPercent ? "app-ready-error" : "app-ready-hint"
                  }
                />
                {errors.operationalReadinessPercent ? (
                  <p id="app-ready-error" className="text-[12px] text-destructive">
                    {errors.operationalReadinessPercent}
                  </p>
                ) : (
                  <p id="app-ready-hint" className="text-[11px] text-muted-foreground">
                    نسبة صحيحة بين ٠ و١٠٠
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="app-sort">ترتيب العرض</Label>
                <Input
                  id="app-sort"
                  type="text"
                  inputMode="numeric"
                  pattern="-?[0-9]*"
                  autoComplete="off"
                  dir="ltr"
                  className="text-start tabular"
                  value={draft.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                  aria-invalid={Boolean(errors.sortOrder)}
                  aria-describedby={errors.sortOrder ? "app-sort-error" : undefined}
                />
                {errors.sortOrder && (
                  <p id="app-sort-error" className="text-[12px] text-destructive">
                    {errors.sortOrder}
                  </p>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <Checkbox checked={draft.isFeatured} onCheckedChange={(v) => set("isFeatured", v === true)} />
              إظهار كتطبيق مميز في واجهة الوزير
            </label>

            {!isEdit && canPublishApps && (
              <label className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                <Checkbox checked={draft.publishNow} onCheckedChange={(v) => set("publishNow", v === true)} />
                نشر التطبيق فور الحفظ على لوحة الوزير
              </label>
            )}
          </section>

          <AppInterfacesEditor value={interfaces} onChange={setInterfaces} disabled={saving} />
          {errors.interfaces && <p className="text-[12px] text-destructive">{errors.interfaces}</p>}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="outline" onClick={() => navigate("/apps")} disabled={saving}>
              إلغاء
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save aria-hidden />}
              {isEdit ? "حفظ التعديلات" : draft.publishNow ? "حفظ ونشر" : "حفظ التطبيق"}
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
