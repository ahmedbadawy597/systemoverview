import { useState, type ReactNode } from "react"
import { Check, Loader2, Lock, PlugZap, ShieldAlert, Users, X } from "lucide-react"
import { Link } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { env, usesNestApi } from "@/config/env"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ticketsApi } from "@/services/api/ticketsApi"
import { useAuth } from "@/services/auth/AuthProvider"
import { PERMISSION_LABELS, ROLE_ORDER, ROLES, type Permission } from "@/services/auth/roles"

const PERMISSIONS: Permission[] = ["view", "create", "approve", "devReview", "delete", "print", "settings", "manageUsers"]

const NEST_ENDPOINTS = [
  { name: "POST /auth/login", use: "تسجيل الدخول" },
  { name: "GET /auth/me", use: "المستخدم الحالي والصلاحيات" },
  { name: "GET /tickets", use: "قائمة الملاحظات مع التصفية والترقيم" },
  { name: "GET /tickets/stats", use: "إحصاءات لوحة التحكم" },
  { name: "POST /tickets", use: "إضافة ملاحظة" },
  { name: "POST /tickets/:id/approve", use: "تصديق ملاحظة" },
  { name: "PATCH /tickets/:id/dev-review", use: "مراجعة المبرمجين" },
  { name: "DELETE /tickets/:id", use: "حذف ملاحظة" },
  { name: "GET /users", use: "إدارة المستخدمين" },
  { name: "POST /reports/notes/pdf", use: "إصدار تقرير PDF رسمي" },
]

export function SettingsPage() {
  const { can } = useAuth()

  if (!can("settings")) {
    return (
      <div className="grid gap-6">
        <PageHeader title="الإعدادات" description="إدارة مصفوفة الصلاحيات والاتصال بالخادم." />
        <EmptyState
          icon={Lock}
          title="الإعدادات متاحة للمدير فقط"
          description="حسابك لا يملك صلاحية الإعدادات. اطلب من المدير تعيين دور المدير لحسابك."
        />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الإعدادات"
        description="مصفوفة أدوار النظام واتصال واجهة الملاحظات بخادم الوزارة."
        actions={
          can("manageUsers") ? (
            <Button asChild variant="outline">
              <Link to="/users">
                <Users aria-hidden />
                إدارة المستخدمين
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex items-start gap-3 rounded-lg border border-[#ecdcae] bg-[#fbf6e8] px-4 py-3 text-[13px] leading-6 text-[#5e4a12]">
        <ShieldAlert className="mt-1 size-4 flex-none" aria-hidden />
        <p>
          الدخول يتم بحساب شخصي عبر NestJS API. أدوار النظام تُعيَّن من صفحة المستخدمين، والصلاحيات تُفرض على الخادم لكل طلب.
        </p>
      </div>

      <SettingsSection title="مصفوفة الصلاحيات" description="ما يستطيع كل دور نظام القيام به. يمكن منح أكثر من دور لنفس الحساب.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
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

      <SettingsSection title="الاتصال بالخادم" description="مصدر بيانات الملاحظات والمستخدمين هو API الوزارة.">
        <ConnectionPanel />
      </SettingsSection>
    </div>
  )
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-4 rounded-xl border border-line bg-surface p-5 shadow-card lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:p-6">
      <div className="grid content-start gap-1">
        <h2 className="font-heading text-[17px] leading-relaxed font-bold text-foreground">{title}</h2>
        <p className="text-[13px] leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="grid content-start gap-4">{children}</div>
    </section>
  )
}

function ConnectionPanel() {
  const [state, setState] = useState<{ status: "idle" | "testing" | "ok" | "error"; message?: string }>({ status: "idle" })
  const nest = usesNestApi()

  async function test() {
    setState({ status: "testing" })
    const started = performance.now()
    try {
      const page = await ticketsApi.listTickets({ page: 1, limit: 1 })
      const ms = Math.round(performance.now() - started)
      setState({
        status: "ok",
        message: `استجاب الخادم خلال ${formatNumber(ms)} م.ث — إجمالي الملاحظات ${formatNumber(page.total)}.`,
      })
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : "تعذّر الاتصال بالخادم." })
    }
  }

  return (
    <div className="grid gap-4">
      <dl className="grid gap-2 text-[13px]">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-soft px-4 py-3">
          <dt className="text-muted-foreground">طريقة الاتصال</dt>
          <dd className="font-bold text-foreground">{nest ? "NestJS REST API" : "وضع قديم / تجريبي"}</dd>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-soft px-4 py-3">
          <dt className="text-muted-foreground">رابط الـ API</dt>
          <dd className="max-w-full truncate font-semibold text-foreground" dir="ltr">
            {env.apiBaseUrl || "—"}
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
        <p className="text-xs font-semibold text-muted-foreground">نقاط النهاية المستخدمة</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {NEST_ENDPOINTS.map((f) => (
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
