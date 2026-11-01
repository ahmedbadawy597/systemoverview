import { ArrowLeft, BadgeCheck, FilePlus2, KeyRound, Landmark, ShieldCheck, Wrench } from "lucide-react"
import { Link } from "react-router-dom"
import { Logo } from "@/components/brand/Logo"
import { useAuth } from "@/services/auth/AuthProvider"
import { ROLES, type ProtectedRole } from "@/services/auth/roles"

const PROTECTED: ProtectedRole[] = ["approver", "developer", "admin"]

const WORKFLOW = [
  { icon: FilePlus2, title: "تسجيل الملاحظة", text: "يسجّل الموظف الملاحظة بوصفها وصورها." },
  { icon: BadgeCheck, title: "التصديق", text: "تعتمد جهة التصديق الملاحظة رسميًا." },
  { icon: Wrench, title: "مراجعة المبرمجين", text: "يدرس الفريق الفني الملاحظة حتى تلافيها." },
]

export function AccessPage() {
  const { signIn, elevate } = useAuth()

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)]">
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="stagger grid w-full max-w-[440px] gap-8 [--stagger-step:90ms]">
          <div className="grid justify-items-center gap-4 text-center">
            <div className="rounded-2xl bg-white p-2 shadow-raised ring-1 ring-line">
              <Logo size={120} />
            </div>
            <div className="grid gap-1">
              <p className="font-formal text-[22px] leading-tight font-bold text-brand-dark">وزارة الأوقاف المصرية</p>
              <h1 className="text-[20px] font-bold text-foreground">نظام إدارة الملاحظات</h1>
              <p className="text-[14px] text-muted-foreground">اختر صلاحية الدخول للمتابعة</p>
            </div>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => signIn("staff")}
              className="group flex items-center gap-4 rounded-xl bg-primary px-5 py-4 text-start text-white shadow-btn transition-[background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand hover:shadow-btn-hover active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="grid flex-1 gap-0.5">
                <span className="text-[15px] font-bold">الدخول كموظف</span>
                <span className="text-[13px] text-white/80">{ROLES.staff.description}</span>
              </span>
              <ArrowLeft className="size-5 text-gold-light transition-transform group-hover:-translate-x-1" aria-hidden />
            </button>

            <p className="pt-3 text-xs font-semibold text-muted-foreground">صلاحيات تتطلب كلمة مرور</p>
            <ul className="stagger grid gap-2 [--stagger-step:70ms]">
              {PROTECTED.map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => void elevate(r)}
                    className="group flex w-full items-center gap-4 rounded-xl border border-line bg-surface px-5 py-3.5 text-start shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-btn/30 hover:shadow-raised active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <ShieldCheck className="size-5 flex-none text-gold transition-transform duration-300 ease-out group-hover:scale-110" strokeWidth={1.75} aria-hidden />
                    <span className="grid flex-1 gap-0.5">
                      <span className="text-[14px] font-bold text-foreground">صلاحية {ROLES[r].label}</span>
                      <span className="text-xs leading-5 text-muted-foreground">{ROLES[r].description}</span>
                    </span>
                    <KeyRound className="size-4 flex-none text-faint transition-[color,transform] duration-300 ease-out group-hover:-rotate-12 group-hover:text-brand" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-center text-xs leading-5 text-muted-foreground">
            جميع البيانات محفوظة في سجل الوزارة على Google Sheets.
          </p>

          <Link
            to="/minister"
            className="group flex items-center gap-4 rounded-xl border border-gold/40 bg-[#fbf8f1] px-5 py-3.5 shadow-xs transition-[border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-gold hover:shadow-raised active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Landmark className="size-5 flex-none text-gold" strokeWidth={1.75} aria-hidden />
            <span className="grid flex-1 gap-0.5">
              <span className="text-[14px] font-bold text-foreground">لوحة معالي وزير الأوقاف</span>
              <span className="text-xs leading-5 text-muted-foreground">لوحة مستقلة لمتابعة المنظومات والتقارير</span>
            </span>
            <ArrowLeft className="size-4 flex-none text-gold transition-transform duration-200 group-hover:-translate-x-1" aria-hidden />
          </Link>
        </div>
      </main>

      <aside className="hidden flex-col justify-between bg-brand-dark p-10 text-white lg:flex xl:p-14">
        <p className="font-formal text-[17px] text-gold-light">قرآن · سنة · سماحة · فكر · نماء</p>
        <div className="stagger grid gap-8 [--stagger-step:120ms]">
          <div className="grid gap-3">
            <h2 className="font-formal text-[34px] leading-tight font-bold">مسار واحد لكل ملاحظة</h2>
            <p className="max-w-sm text-[15px] leading-8 text-white/80">
              من التسجيل إلى التصديق ثم المعالجة الفنية، مع تقرير رسمي قابل للطباعة في أي وقت.
            </p>
          </div>
          <ol className="stagger grid gap-5 [--stagger-step:110ms]">
            {WORKFLOW.map((step) => (
              <li key={step.title} className="flex items-start gap-4">
                <span className="flex size-10 flex-none items-center justify-center rounded-full bg-white/10 text-gold-light">
                  <step.icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="grid gap-0.5">
                  <span className="text-[15px] font-bold">{step.title}</span>
                  <span className="text-[13px] leading-6 text-white/75">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-white/60">The Ministry of Awqaf of Egypt · نظام إدارة الملاحظات</p>
      </aside>
    </div>
  )
}
