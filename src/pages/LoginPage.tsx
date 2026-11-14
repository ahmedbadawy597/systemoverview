import { useState, type FormEvent } from "react"
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Logo } from "@/components/brand/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/services/auth/AuthProvider"

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError("أدخل اسم المستخدم وكلمة المرور.")
      return
    }
    setSubmitting(true)
    try {
      const result = await login(username, password)
      if (!result.ok) {
        setError(result.reason === "inactive" ? "هذا الحساب موقوف. راجع مدير النظام." : "اسم المستخدم أو كلمة المرور غير صحيحة.")
        return
      }
      // Assistant workspace: land on applications after login.
      const next = result.user.jobTitle === "assistant" || result.user.roles.includes("admin") ? "/apps" : "/"
      navigate(next, { replace: true })
    } catch (error) {
      setError(error instanceof Error ? error.message : "تعذّر الاتصال بالخادم.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="stagger grid w-full max-w-[440px] gap-8 [--stagger-step:80ms]">
          <div className="grid justify-items-center gap-4 text-center">
            <div className="rounded-2xl bg-white p-2 shadow-raised ring-1 ring-line">
              <Logo size={120} />
            </div>
            <div className="grid gap-1">
              <p className="font-formal text-[28px] leading-relaxed font-bold text-brand-dark">وزارة الأوقاف المصرية</p>
              <h1 className="font-formal text-[24px] leading-relaxed font-bold text-foreground">نظام إدارة الملاحظات</h1>
              <p className="text-[14px] text-muted-foreground">سجّل الدخول بحسابك الشخصي للمتابعة</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6" noValidate>
            <div className="grid gap-1.5">
              <Label htmlFor="login-username">اسم المستخدم</Label>
              <Input
                id="login-username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: admin"
                disabled={submitting}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="login-password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pe-11"
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="absolute top-1/2 end-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-faint hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-[#fdf3f2] px-3 py-2 text-[13px] text-danger ring-1 ring-danger/15">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
              تسجيل الدخول
              <ArrowLeft aria-hidden />
            </Button>
          </form>
        </div>
      </main>

      <aside className="hidden flex-col justify-between bg-brand-dark p-10 text-white lg:flex xl:p-14">
        <p className="font-formal text-[20px] leading-relaxed text-gold-light">قرآن · سنة · سماحة · فكر · نماء</p>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <h2 className="font-formal text-[34px] leading-relaxed font-bold">دخول بالحساب الشخصي</h2>
            <p className="max-w-sm text-[15px] leading-8 text-white/80">
              المسميات الوظيفية (وزير / مساعد / موظف) للتعريف فقط. صلاحيات النظام يعيّنها المدير لكل مستخدم.
            </p>
          </div>
          <ol className="grid gap-4 text-[14px] leading-7 text-white/80">
            <li>١. المدير ينشئ الحساب ويعين أدوار النظام.</li>
            <li>٢. المستخدم يسجل الدخول باسمه وكلمة مروره.</li>
            <li>٣. الواجهة تعرض فقط ما تسمح به صلاحياته.</li>
          </ol>
        </div>
        <p className="text-xs text-white/60">The Ministry of Awqaf of Egypt · نظام إدارة الملاحظات</p>
      </aside>
    </div>
  )
}
