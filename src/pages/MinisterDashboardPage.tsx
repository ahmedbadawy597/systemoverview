import { useEffect, useState, type ComponentType } from "react"
import {
  ArrowLeft,
  ArrowLeftRight,
  Award,
  ChevronLeft,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Gauge,
  Landmark,
  LayoutGrid,
  Users,
  type LucideIcon,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Logo } from "@/components/brand/Logo"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCountUp } from "@/hooks/useCountUp"
import { formatNumber } from "@/lib/format"
import { openMinisterReportPdf } from "@/lib/ministerReportPdf"
import { cn } from "@/lib/utils"

type MinisterReport = {
  id: string
  period: string
  title: string
  scope: string
  summary: string
  metrics: { label: string; value: string }[]
  highlights: string[]
}

const SECTIONS = [
  { id: "top", label: "الرئيسية" },
  { id: "apps", label: "التطبيقات" },
  { id: "reports", label: "التقارير" },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

const APPS: {
  name: string
  description: string
  href: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
}[] = [
  {
    name: "منظومة مؤشرات الأداء الاستراتيجية",
    description: "متابعة مؤشرات الأداء الاستراتيجية للوزارة.",
    href: "https://awkaf.Strategizeit.us",
    icon: Gauge,
  },
  {
    name: "المسابقة العالمية للقرآن الكريم",
    description: "بوابة المسابقة العالمية للقرآن الكريم.",
    href: "https://contest.strategizeit.us/ar/login",
    icon: Award,
  },
  {
    name: "منظومة إدخال بيانات المساجد",
    description: "إدخال بيانات المساجد وتحديثها.",
    href: "https://awaf-mosques.strategizeit.us/login",
    icon: Landmark,
  },
  {
    name: "منظومة التنقلات والتعيينات",
    description: "إدارة التنقلات والتعيينات.",
    href: "https://transfer.strategizeit.us/",
    icon: ArrowLeftRight,
  },
]

const REPORTS: MinisterReport[] = [
  {
    id: "mosques-q3",
    period: "الربع الثالث",
    title: "إنجازات منظومة المساجد",
    scope: "منظومة المساجد",
    summary:
      "عرض تجريبي لإنجازات منظومة إدخال بيانات المساجد خلال الربع الثالث، يشمل تحديث السجلات واكتمال البيانات الأساسية على مستوى المديريات.",
    metrics: [
      { label: "مساجد محدَّثة", value: "١٬٢٤٠" },
      { label: "مديريات مكتملة", value: "١٨" },
      { label: "نسبة الاكتمال", value: "٨٧٪" },
    ],
    highlights: [
      "استكمال بيانات المساجد في ١٨ مديرية خلال الربع.",
      "تقليل زمن إدخال السجل الجديد إلى أقل من دقيقتين.",
      "توحيد حقول العنوان والإحداثيات عبر المنظومة.",
    ],
  },
  {
    id: "quran-sep-2026",
    period: "سبتمبر ٢٠٢٦",
    title: "نتائج المسابقة العالمية للقرآن",
    scope: "المسابقة العالمية",
    summary:
      "عرض تجريبي لنتائج المسابقة العالمية للقرآن الكريم لشهر سبتمبر ٢٠٢٦، مع ملخص المشاركين والفائزين حسب الفروع الرئيسية.",
    metrics: [
      { label: "المشاركون", value: "٣٬٤٨٠" },
      { label: "الدول", value: "٤٢" },
      { label: "الفائزون", value: "٣٦" },
    ],
    highlights: [
      "افتتاح باب التسجيل الإلكتروني عبر بوابة المسابقة.",
      "اعتماد نتائج الفروع الثلاثة بعد المراجعة النهائية.",
      "إصدار شهادات الفائزين عبر المنظومة الرقمية.",
    ],
  },
  {
    id: "kpi-q2",
    period: "الربع الثاني",
    title: "مؤشرات الأداء الاستراتيجية",
    scope: "مؤشرات الأداء",
    summary:
      "عرض تجريبي لمؤشرات الأداء الاستراتيجية للوزارة في الربع الثاني، لمتابعة نسب الإنجاز مقابل المستهدفات المعتمدة.",
    metrics: [
      { label: "مؤشرات متابعة", value: "٢٤" },
      { label: "تحقق المستهدف", value: "٧٩٪" },
      { label: "مؤشرات متقدمة", value: "١١" },
    ],
    highlights: [
      "ارتفاع مؤشر التحول الرقمي بنسبة ١٢٪ عن الربع السابق.",
      "استقرار مؤشرات خدمة المساجد ضمن النطاق المستهدف.",
      "تحديد ثلاثة مؤشرات تحتاج تدخلًا إداريًا في الربع التالي.",
    ],
  },
]

const STATS: {
  label: string
  value: number
  subtitle: string
  icon: LucideIcon
  tone: "brand" | "gold" | "study" | "resolved"
}[] = [
  { label: "أهم التطبيقات", value: 4, subtitle: "منظومات المتابعة المعروضة", icon: LayoutGrid, tone: "brand" },
  { label: "إجمالي المستخدمين", value: 4500, subtitle: "على منظومات الوزارة", icon: Users, tone: "gold" },
  { label: "إجمالي التطبيقات", value: 12, subtitle: "منظومة رقمية بالوزارة", icon: Gauge, tone: "study" },
  { label: "تقارير النجاح", value: 3, subtitle: "تقارير معروضة في اللوحة", icon: FileCheck2, tone: "resolved" },
]

const TONE = {
  brand: {
    card: "from-surface via-surface to-surface-tint/60",
    icon: "bg-surface-tint text-brand ring-brand/15",
    bar: "bg-brand",
    glow: "bg-brand/10",
  },
  gold: {
    card: "from-surface via-surface to-[#fbf8f1]",
    icon: "bg-[var(--status-pending-bg)] text-[#7d6420] ring-gold/20",
    bar: "bg-gold",
    glow: "bg-gold/15",
  },
  study: {
    card: "from-surface via-surface to-[var(--status-study-bg)]/50",
    icon: "bg-[var(--status-study-bg)] text-[var(--status-study-ink)] ring-[var(--status-study-dot)]/20",
    bar: "bg-[var(--status-study-dot)]",
    glow: "bg-[var(--status-study-dot)]/10",
  },
  resolved: {
    card: "from-surface via-surface to-[var(--status-resolved-bg)]/45",
    icon: "bg-[var(--status-resolved-bg)] text-[var(--status-resolved-ink)] ring-[var(--status-resolved-dot)]/20",
    bar: "bg-[var(--status-resolved-dot)]",
    glow: "bg-[var(--status-resolved-dot)]/10",
  },
} as const

function SectionHeading({
  eyebrow,
  title,
  description,
  count,
}: {
  eyebrow: string
  title: string
  description: string
  count?: number
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="grid gap-2">
        <div className="flex items-center gap-2.5">
          <span className="h-4 w-[3px] rounded-full bg-gold" aria-hidden />
          <p className="text-[12px] font-bold tracking-wide text-gold">{eyebrow}</p>
        </div>
        <h2 className="font-heading text-[24px] leading-relaxed font-bold text-foreground sm:text-[28px]">{title}</h2>
        <p className="max-w-xl text-[13.5px] leading-7 text-muted-foreground">{description}</p>
      </div>
      {count !== undefined && (
        <span className="tabular rounded-full bg-surface px-3.5 py-1.5 text-[13px] font-bold text-brand-dark shadow-xs ring-1 ring-line">
          {formatNumber(count)} عنصر
        </span>
      )}
    </div>
  )
}

function MinisterStatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  subtitle: string
  icon: LucideIcon
  tone: keyof typeof TONE
}) {
  const shown = useCountUp(value)
  const t = TONE[tone]
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br p-5 shadow-card transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:border-gold/30 hover:shadow-raised",
        t.card,
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-[3px]", t.bar)} aria-hidden />
      <span
        className={cn(
          "pointer-events-none absolute -end-6 -top-6 size-24 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100",
          t.glow,
          "opacity-70",
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-[12.5px] font-semibold text-muted-foreground">{label}</p>
          <p className="tabular text-[34px] leading-none font-bold text-foreground" aria-label={formatNumber(value)}>
            <span aria-hidden>{formatNumber(shown)}</span>
          </p>
        </div>
        <span
          className={cn(
            "flex size-11 flex-none items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110",
            t.icon,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <p className="relative mt-5 text-[12.5px] leading-5 text-muted-foreground">{subtitle}</p>
    </article>
  )
}

const gregorianDate = new Intl.DateTimeFormat("ar-EG", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})
const gregorianTime = new Intl.DateTimeFormat("ar-EG", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})
const hijriDate = new Intl.DateTimeFormat("ar-EG-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

function scrollToSection(id: SectionId) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
}

function GoldBorderFrame() {
  return (
    <svg className="minister-hero__frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="minister-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3e2b0" />
          <stop offset="35%" stopColor="#c5a869" />
          <stop offset="70%" stopColor="#a18841" />
          <stop offset="100%" stopColor="#f3e2b0" />
        </linearGradient>
      </defs>
      {/* Soft permanent gold track */}
      <rect
        className="minister-hero__frame-track"
        x="1.1"
        y="1.1"
        width="97.8"
        height="97.8"
        rx="3.2"
        ry="3.2"
        pathLength="100"
        vectorEffect="non-scaling-stroke"
      />
      {/* Bright segment that travels the perimeter */}
      <rect
        className="minister-hero__frame-chase"
        x="1.1"
        y="1.1"
        width="97.8"
        height="97.8"
        rx="3.2"
        ry="3.2"
        pathLength="100"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function MinisterDashboardPage() {
  const now = useNow()
  const [active, setActive] = useState<SectionId>("top")
  const [selectedReport, setSelectedReport] = useState<MinisterReport | null>(null)

  useEffect(() => {
    const previous = document.title
    document.title = "لوحة معالي وزير الأوقاف — وزارة الأوقاف المصرية"
    return () => {
      document.title = previous
    }
  }, [])

  useEffect(() => {
    const nodes = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (node): node is HTMLElement => !!node,
    )
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const id = visible?.target.id
        if (id === "top" || id === "apps" || id === "reports") setActive(id)
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.35, 0.6] },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-dvh overflow-x-clip bg-[radial-gradient(ellipse_at_top,rgba(232,240,236,0.9),transparent_55%),var(--background)]">
      <header className="sticky top-0 z-40 border-b border-line-soft bg-surface/90 shadow-header backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex max-w-[1120px] items-center gap-3 px-4 py-3 sm:px-6">
          <Logo size={48} />
          <div className="grid min-w-0 leading-tight">
            <p className="font-formal truncate text-[18px] leading-relaxed font-bold text-brand-dark">وزارة الأوقاف المصرية</p>
            <p className="truncate text-xs text-muted-foreground">منظومات التحول الرقمي</p>
            <p className="truncate text-xs font-bold text-brand md:hidden">معالي وزير الأوقاف</p>
          </div>
          <div className="ms-auto flex items-center gap-3 sm:gap-5">
            <div className="grid shrink-0 text-end leading-tight">
              <p className="tabular text-[15px] font-bold text-foreground">{gregorianTime.format(now)}</p>
              <p className="text-[11px] whitespace-nowrap text-muted-foreground sm:text-[12px]">
                {gregorianDate.format(now)}
              </p>
              <p className="text-[11px] whitespace-nowrap font-semibold text-brand sm:text-[12px]">
                {hijriDate.format(now)}
              </p>
            </div>
            <span className="hidden rounded-full bg-surface-tint px-3 py-1.5 text-[13px] font-bold text-brand-dark ring-1 ring-brand/10 md:inline">
              معالي وزير الأوقاف
            </span>
          </div>
        </div>
        <nav aria-label="أقسام اللوحة" className="mx-auto flex max-w-[1120px] gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              aria-current={active === section.id ? "true" : undefined}
              className={cn(
                "relative h-9 flex-none rounded-lg px-3.5 text-[13.5px] font-semibold transition-colors duration-200",
                active === section.id
                  ? "bg-surface-tint text-brand-dark"
                  : "text-muted-foreground hover:bg-surface-soft hover:text-foreground",
              )}
            >
              {section.label}
              {active === section.id && (
                <span className="absolute inset-x-3 -bottom-2 h-[2px] rounded-full bg-gold" aria-hidden />
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 py-6 sm:px-6 sm:py-8">
        <section id="top" className="minister-hero scroll-mt-36">
          <div className="minister-hero__glow" aria-hidden />
          <div className="relative overflow-hidden rounded-2xl bg-brand-dark text-white shadow-overlay">
            <GoldBorderFrame />
            <div className="minister-hero__sheen" aria-hidden />

            {/* Soft atmospheric layers */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.14]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)",
                backgroundSize: "22px 22px",
              }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -start-16 top-1/2 size-64 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -end-10 -top-10 size-52 rounded-full bg-primary/30 blur-3xl"
              aria-hidden
            />

            <div className="relative grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-10 lg:p-10">
              <div className="minister-hero__logo-plate justify-self-center rounded-2xl bg-white p-2.5 shadow-float ring-1 ring-gold/35 lg:justify-self-start">
                <Logo size={104} />
              </div>
              <div className="minister-hero__copy grid justify-items-center gap-4 text-center lg:justify-items-start lg:text-start">
                <p className="font-formal text-[22px] leading-relaxed text-gold-light sm:text-[24px]">وزارة الأوقاف المصرية</p>
                <h1 className="font-formal text-[34px] leading-[1.35] font-bold text-white sm:text-[42px]">
                  مرحباً بمعالي الوزير
                </h1>
                <p className="font-formal text-[18px] leading-relaxed text-gold-light/95 sm:text-[20px]">معالي وزير الأوقاف</p>
                <p className="max-w-xl text-[15px] leading-8 text-white/80">
                  لوحة متابعة منظومات التحول الرقمي بوزارة الأوقاف، للوصول إلى التطبيقات والاطلاع على تقارير النجاح من مكان
                  واحد.
                </p>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <button
                    type="button"
                    onClick={() => scrollToSection("apps")}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold px-4 text-[13.5px] font-bold text-brand-dark shadow-[0_8px_20px_-8px_rgba(193,168,105,0.55)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-gold-light"
                  >
                    الانتقال إلى التطبيقات
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection("reports")}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 text-[13.5px] font-semibold text-white/90 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-gold/40 hover:bg-white/10"
                  >
                    تقارير النجاح
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="مؤشرات اللوحة" className="stagger grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat) => (
            <MinisterStatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section id="apps" className="scroll-mt-36 grid gap-5">
          <SectionHeading
            eyebrow="المنظومات الرقمية"
            title="التطبيقات"
            description="أربع منظومات أساسية للوزارة. يُفتح كل تطبيق في نافذة جديدة."
            count={APPS.length}
          />
          <ul className="stagger grid gap-4 sm:grid-cols-2">
            {APPS.map((app, index) => (
              <li key={app.href}>
                <a
                  href={app.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-float focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-transparent via-gold to-gold-light opacity-80" aria-hidden />
                  <span
                    className="pointer-events-none absolute -end-10 top-0 size-32 rounded-full bg-gold/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  />
                  <div className="relative flex flex-1 flex-col gap-5 p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-12 flex-none items-center justify-center rounded-xl bg-surface-tint text-brand ring-1 ring-inset ring-brand/10 transition-[background-color,color,transform] duration-300 ease-out group-hover:scale-110 group-hover:bg-[#f7f0de] group-hover:text-[#7d6420] group-hover:ring-gold/30">
                        <app.icon className="size-5" strokeWidth={1.75} />
                      </span>
                      <span className="tabular rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-muted-foreground ring-1 ring-line-soft">
                        {formatNumber(index + 1)} / {formatNumber(APPS.length)}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      <h3 className="font-heading text-[18px] leading-relaxed font-bold text-foreground transition-colors group-hover:text-brand-dark">
                        {app.name}
                      </h3>
                      <p className="text-[13.5px] leading-7 text-muted-foreground">{app.description}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-line-soft pt-4">
                      <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-brand">
                        فتح التطبيق
                        <ExternalLink className="size-3.5 opacity-70" aria-hidden />
                      </span>
                      <span className="flex size-9 items-center justify-center rounded-full bg-surface-soft text-brand transition-transform duration-300 group-hover:-translate-x-1 group-hover:bg-brand group-hover:text-white">
                        <ArrowLeft className="size-4" aria-hidden />
                      </span>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section id="reports" className="scroll-mt-36 grid gap-5">
          <SectionHeading
            eyebrow="المتابعة الرسمية"
            title="تقارير النجاح"
            description="اضغط على أي تقرير لعرض نسخة تجريبية من ملخصه ومؤشراته، بنفس أسلوب فتح الملاحظة."
            count={REPORTS.length}
          />
          <ol className="stagger overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            {REPORTS.map((report, index) => (
              <li key={report.id} className="border-b border-line-soft last:border-b-0">
                <button
                  type="button"
                  onClick={() => setSelectedReport(report)}
                  className="group relative flex w-full items-start gap-4 px-5 py-5 text-start transition-[background-color] duration-200 hover:bg-[#fbf8f1] focus-visible:bg-[#fbf8f1] focus-visible:outline-none sm:items-center sm:gap-5 sm:px-6"
                >
                  <span
                    className="absolute inset-y-3 start-0 w-[3px] origin-center scale-y-0 rounded-full bg-gold transition-transform duration-300 group-hover:scale-y-100 group-focus-visible:scale-y-100"
                    aria-hidden
                  />
                  <span className="tabular flex size-11 flex-none items-center justify-center rounded-xl bg-[var(--status-pending-bg)] text-[15px] font-bold text-[#6a5216] ring-1 ring-gold/25 transition-transform duration-300 group-hover:scale-105">
                    {formatNumber(index + 1)}
                  </span>
                  <div className="grid min-w-0 flex-1 gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-surface-tint px-2.5 py-0.5 text-[11.5px] font-bold text-brand ring-1 ring-brand/10">
                        {report.period}
                      </span>
                      <span className="text-[11.5px] font-semibold text-muted-foreground">{report.scope}</span>
                    </div>
                    <p className="font-heading text-[17px] leading-relaxed font-bold text-foreground transition-colors group-hover:text-brand-dark">
                      {report.title}
                    </p>
                    <p className="line-clamp-1 text-[12.5px] text-muted-foreground sm:hidden">{report.summary}</p>
                  </div>
                  <span className="ms-auto flex flex-none items-center gap-2">
                    <span className="hidden items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1.5 text-[12px] font-bold text-brand ring-1 ring-line-soft transition-colors group-hover:bg-brand group-hover:text-white group-hover:ring-brand sm:inline-flex">
                      <Eye className="size-3.5" aria-hidden />
                      عرض التقرير
                    </span>
                    <span className="flex size-10 items-center justify-center rounded-full bg-surface-soft text-brand ring-1 ring-line-soft transition-[background-color,color,transform] duration-300 group-hover:-translate-x-0.5 group-hover:bg-brand group-hover:text-white">
                      <ChevronLeft className="size-4" aria-hidden />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-5 pb-2 text-xs text-muted-foreground">
          <p>وزارة الأوقاف المصرية · لوحة معالي وزير الأوقاف</p>
          <Link to="/" className="font-semibold text-brand transition-colors hover:text-brand-dark">
            نظام إدارة الملاحظات
          </Link>
        </footer>
      </main>

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-h-[min(90dvh,760px)] gap-0 overflow-hidden p-0 sm:max-w-2xl" showCloseButton>
          {selectedReport && (
            <>
              <div className="border-b border-line-soft bg-gradient-to-l from-surface via-surface to-[#fbf8f1] px-6 pt-6 pb-5">
                <DialogHeader className="gap-3 pe-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-tint px-2.5 py-0.5 text-[11.5px] font-bold text-brand ring-1 ring-brand/10">
                      {selectedReport.period}
                    </span>
                    <span className="rounded-full bg-[var(--status-pending-bg)] px-2.5 py-0.5 text-[11.5px] font-bold text-[#6a5216] ring-1 ring-gold/20">
                      عرض تجريبي
                    </span>
                    <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11.5px] font-semibold text-muted-foreground ring-1 ring-line">
                      {selectedReport.scope}
                    </span>
                  </div>
                  <DialogTitle className="font-formal text-[26px] leading-[1.5] text-brand-dark">
                    {selectedReport.title}
                  </DialogTitle>
                  <DialogDescription className="text-[14px] leading-7 text-muted-foreground">
                    {selectedReport.summary}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="grid max-h-[min(58dvh,460px)] gap-5 overflow-y-auto px-6 py-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  {selectedReport.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="relative overflow-hidden rounded-xl border border-line bg-surface px-3.5 py-4 text-center shadow-card"
                    >
                      <span className="absolute inset-x-0 top-0 h-[3px] bg-gold" aria-hidden />
                      <p className="tabular text-[24px] leading-none font-bold text-brand-dark">{metric.value}</p>
                      <p className="mt-2.5 text-[12px] font-semibold text-muted-foreground">{metric.label}</p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs sm:p-5">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="size-4 text-brand" strokeWidth={1.75} aria-hidden />
                    <p className="text-[13.5px] font-bold text-foreground">أبرز النقاط</p>
                  </div>
                  <ul className="grid gap-3">
                    {selectedReport.highlights.map((item, index) => (
                      <li key={item} className="flex items-start gap-3 text-[13.5px] leading-7 text-muted-foreground">
                        <span className="tabular mt-0.5 flex size-6 flex-none items-center justify-center rounded-full bg-[var(--status-pending-bg)] text-[11px] font-bold text-[#6a5216]">
                          {formatNumber(index + 1)}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="rounded-lg bg-surface-soft px-3.5 py-3 text-[12px] leading-6 text-muted-foreground ring-1 ring-line-soft">
                  محتوى تجريبي للعرض داخل اللوحة. زر «فتح PDF» يفتح مستندًا رسميًا يمكن حفظه كملف PDF من نافذة الطباعة.
                </p>
              </div>

              <DialogFooter className="m-0 rounded-none border-t border-line-soft bg-surface-soft/80 px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setSelectedReport(null)}>
                  إغلاق
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const opened = openMinisterReportPdf(selectedReport)
                    if (!opened) {
                      toast.error("تعذر فتح نافذة PDF", {
                        description: "اسمح بالنوافذ المنبثقة ثم أعد المحاولة.",
                      })
                      return
                    }
                    toast.success("تم فتح مستند التقرير", {
                      description: "استخدم طباعة / حفظ PDF من النافذة الجديدة.",
                    })
                  }}
                >
                  <FileText aria-hidden />
                  فتح PDF
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
