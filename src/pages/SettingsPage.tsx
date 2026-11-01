import { useState, type FormEvent, type ReactNode } from "react"
import { Check, CircleCheck, CircleDashed, Copy, Loader2, Lock, PlugZap, ShieldAlert, X } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { env } from "@/config/env"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ticketsApi } from "@/services/api/ticketsApi"
import { resolveMode, type BackendFunction } from "@/services/api/transport"
import { useAuth } from "@/services/auth/AuthProvider"
import { isRoleConfigured, sha256Hex } from "@/services/auth/authService"
import { PERMISSION_LABELS, ROLE_ORDER, ROLES, type Permission, type ProtectedRole } from "@/services/auth/roles"

const PERMISSIONS: Permission[] = ["view", "create", "approve", "devReview", "delete", "print", "settings"]
const FUNCTIONS: { name: BackendFunction | "doGet" | "getSheet"; use: string }[] = [
  { name: "doGet", use: "تقديم واجهة النظام من Apps Script" },
  { name: "getSheet", use: "الوصول إلى ورقة الملاحظات (داخلي في الخادم)" },
  { name: "fetchTickets", use: "تحميل جميع الملاحظات" },
  { name: "addTicketToSheet", use: "إضافة ملاحظة جديدة مع الصور" },
  { name: "approveTicketInSheet", use: "تصديق ملاحظة" },
  { name: "updateDevInSheet", use: "حفظ حالة وملاحظات المبرمجين" },
  { name: "deleteTicketFromSheet", use: "حذف ملاحظة" },
]
const ENV_KEYS: Record<ProtectedRole, string> = {
  approver: "VITE_ROLE_HASH_APPROVER",
  developer: "VITE_ROLE_HASH_DEVELOPER",
  admin: "VITE_ROLE_HASH_ADMIN",
}
const MODE_LABELS = {
  gas: "Google Apps Script (google.script.run)",
  http: "رابط Web App لـ Google Apps Script",
  mock: "عرض تجريبي — لم يُضبط الخادم بعد",
}

export function SettingsPage() {
  const { can, ensure } = useAuth()

  if (!can("settings")) {
    return (
      <div className="grid gap-6">
        <PageHeader title="الإعدادات" description="إدارة الصلاحيات والاتصال بالخادم." />
        <EmptyState
          icon={Lock}
          title="الإعدادات متاحة للمدير فقط"
          description="أدخل كلمة مرور المدير لعرض إعدادات الصلاحيات والاتصال بالخادم."
          action={
            <Button onClick={() => void ensure("settings")}>
              <Lock aria-hidden />
              فتح صلاحية المدير
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="الإعدادات" description="الصلاحيات وكلمات المرور والاتصال بخادم Google Apps Script." />

      <div className="flex items-start gap-3 rounded-lg border border-[#ecdcae] bg-[#fbf6e8] px-4 py-3 text-[13px] leading-6 text-[#5e4a12]">
        <ShieldAlert className="mt-1 size-4 flex-none" aria-hidden />
        <p>
          <span className="font-bold">تنبيه أمني:</span> التحقق من كلمات المرور يتم حاليًا داخل المتصفح كما في النظام الحالي، وهو ليس
          مصادقة آمنة. طبقة الصلاحيات معزولة في ملف واحد لتسهيل نقلها لاحقًا إلى تحقق من جهة الخادم.
        </p>
      </div>

      <SettingsSection title="مستويات الوصول" description="ما يستطيع كل مستوى القيام به داخل النظام.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-muted-foreground">
                <th className="py-2.5 pe-4 text-start font-semibold">الصلاحية</th>
                {ROLE_ORDER.map((r) => (
                  <th key={r} className="px-2 py-2.5 text-center font-semibold">
                    {ROLES[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 pe-4 text-foreground">{PERMISSION_LABELS[p]}</td>
                  {ROLE_ORDER.map((r) => (
                    <td key={r} className="px-2 py-2.5 text-center">
                      {ROLES[r].permissions.includes(p) ? (
                        <Check className="mx-auto size-4 text-brand-btn" aria-label="مسموح" />
                      ) : (
                        <X className="mx-auto size-4 text-[#b5bfba]" aria-label="غير مسموح" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsSection>

      <SettingsSection
        title="كلمات المرور"
        description="حالة ضبط كلمة مرور كل صلاحية. لا تُعرض كلمات المرور في الواجهة مطلقًا."
        aside={<HashGenerator />}
      >
        <ul className="grid gap-2">
          {(["approver", "developer", "admin"] as ProtectedRole[]).map((r) => {
            const ok = isRoleConfigured(r)
            return (
              <li key={r} className="flex items-center justify-between gap-3 rounded-lg bg-surface-soft px-4 py-3">
                <span className="grid gap-0.5">
                  <span className="text-[14px] font-bold text-foreground">{ROLES[r].label}</span>
                  <span className="text-xs text-muted-foreground" dir="ltr">
                    {ENV_KEYS[r]}
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex h-6 flex-none items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold",
                    ok ? "bg-[var(--status-approved-bg)] text-[var(--status-approved-ink)]" : "bg-[var(--status-pending-bg)] text-[var(--status-pending-ink)]",
                  )}
                >
                  {ok ? <CircleCheck className="size-3.5" aria-hidden /> : <CircleDashed className="size-3.5" aria-hidden />}
                  {ok ? "مضبوطة" : "غير مضبوطة"}
                </span>
              </li>
            )
          })}
        </ul>
      </SettingsSection>

      <SettingsSection title="الاتصال بالخادم" description="مصدر البيانات هو خادم الوزارة عبر Google Apps Script.">
        <ConnectionPanel />
      </SettingsSection>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
  aside,
}: {
  title: string
  description: string
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <section className="grid gap-4 rounded-xl border border-line bg-surface p-5 shadow-card lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:p-6">
      <div className="grid content-start gap-1">
        <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
        <p className="text-[13px] leading-6 text-muted-foreground">{description}</p>
        {aside && <div className="mt-4 hidden lg:block">{aside}</div>}
      </div>
      <div className="grid content-start gap-4">
        {children}
        {aside && <div className="lg:hidden">{aside}</div>}
      </div>
    </section>
  )
}

function ConnectionPanel() {
  const mode = resolveMode()
  const [state, setState] = useState<{ status: "idle" | "testing" | "ok" | "error"; message?: string }>({ status: "idle" })

  async function test() {
    setState({ status: "testing" })
    const started = performance.now()
    try {
      const list = await ticketsApi.fetchTickets()
      const ms = Math.round(performance.now() - started)
      setState({ status: "ok", message: `استجاب الخادم خلال ${formatNumber(ms)} م.ث وأعاد ${formatNumber(list.length)} ملاحظة.` })
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "تعذّر الاتصال بالخادم." })
    }
  }

  const masked = env.appsScriptUrl ? env.appsScriptUrl.replace(/(\/macros\/s\/)([^/]{6})[^/]+/, "$1$2…") : "—"

  return (
    <div className="grid gap-4">
      <dl className="grid gap-2 text-[13px]">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-soft px-4 py-3">
          <dt className="text-muted-foreground">طريقة الاتصال</dt>
          <dd className="font-bold text-foreground">{MODE_LABELS[mode]}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-soft px-4 py-3">
          <dt className="text-muted-foreground">رابط الخادم</dt>
          <dd className="max-w-full truncate font-semibold text-foreground" dir="ltr">
            {masked}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => void test()} disabled={state.status === "testing"}>
          {state.status === "testing" ? <Loader2 className="animate-spin" aria-hidden /> : <PlugZap aria-hidden />}
          اختبار الاتصال
        </Button>
        {state.message && (
          <p role="status" className={cn("text-[13px]", state.status === "error" ? "text-danger" : "text-[var(--status-approved-ink)]")}>
            {state.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold text-muted-foreground">دوال الخادم المستخدمة</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {FUNCTIONS.map((f) => (
            <li key={f.name} className="grid gap-0.5 rounded-lg border border-line-soft px-3 py-2">
              <code className="text-[12.5px] font-semibold text-brand" dir="ltr">
                {f.name}
              </code>
              <span className="text-xs text-muted-foreground">{f.use}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function HashGenerator() {
  const [role, setRole] = useState<ProtectedRole>("admin")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [line, setLine] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLine(null)
    if (password.length < 8) return setError("استخدم ٨ أحرف على الأقل.")
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين.")
    setError(null)
    setLine(`${ENV_KEYS[role]}=${await sha256Hex(password)}`)
    setPassword("")
    setConfirm("")
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-line p-4" noValidate>
      <p className="text-[13px] font-bold text-foreground">تغيير كلمة مرور</p>
      <p className="text-xs leading-5 text-muted-foreground">
        يولّد سطر الإعداد الذي يُضاف إلى ملف <span dir="ltr">.env</span> ثم يُعاد بناء النظام. لا تُرسل كلمة المرور إلى أي جهة.
      </p>
      <div className="grid gap-1.5">
        <Label className="text-xs font-semibold" id="hash-role-label">
          الصلاحية
        </Label>
        <Select value={role} onValueChange={(v) => setRole(v as ProtectedRole)}>
          <SelectTrigger className="w-full" aria-labelledby="hash-role-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {(["approver", "developer", "admin"] as ProtectedRole[]).map((r) => (
              <SelectItem key={r} value={r}>
                {ROLES[r].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="hash-pass" className="text-xs font-semibold">
          كلمة المرور الجديدة
        </Label>
        <Input id="hash-pass" type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="hash-confirm" className="text-xs font-semibold">
          تأكيد كلمة المرور
        </Label>
        <Input id="hash-confirm" type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <Button type="submit" variant="outline" size="sm">
        توليد سطر الإعداد
      </Button>
      {line && (
        <div className="grid gap-2">
          <code className="block rounded-md bg-surface-soft p-2.5 text-[11px] leading-5 break-all text-foreground" dir="ltr">
            {line}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-fit"
            onClick={() => {
              void navigator.clipboard.writeText(line).then(
                () => toast.success("تم نسخ سطر الإعداد"),
                () => toast.error("تعذّر النسخ، انسخ السطر يدويًا"),
              )
            }}
          >
            <Copy aria-hidden />
            نسخ
          </Button>
        </div>
      )}
    </form>
  )
}
