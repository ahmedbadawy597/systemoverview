const LOCALE = "ar-EG"

const numberFmt = new Intl.NumberFormat(LOCALE)
const percentFmt = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0 })
const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" })
const shortDateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" })
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit" })
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: "short" })
const monthYearFmt = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" })
const relativeFmt = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" })

export const formatNumber = (n: number) => numberFmt.format(n)
export const formatPercent = (ratio: number) => percentFmt.format(Number.isFinite(ratio) ? ratio : 0)

function valid(iso: string | null | undefined) {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) || d.getTime() === 0 ? null : d
}

export const formatDate = (iso: string | null | undefined) => {
  const d = valid(iso)
  return d ? dateFmt.format(d) : "—"
}
export const formatShortDate = (iso: string | null | undefined) => {
  const d = valid(iso)
  return d ? shortDateFmt.format(d) : "—"
}
export const formatDateTime = (iso: string | null | undefined) => {
  const d = valid(iso)
  return d ? dateTimeFmt.format(d) : "—"
}
export const formatTime = (iso: string | null | undefined) => {
  const d = valid(iso)
  return d ? timeFmt.format(d) : "—"
}
export const formatMonth = (d: Date) => monthFmt.format(d)
export const formatMonthYear = (d: Date) => monthYearFmt.format(d)

/** "اليوم", "أمس", "منذ ٣ أيام", falling back to the date after two weeks. */
export function formatRelative(iso: string | null | undefined) {
  const d = valid(iso)
  if (!d) return "—"
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000)
  if (days < 0) return formatShortDate(iso)
  if (days <= 14) return relativeFmt.format(-days, "day")
  return formatShortDate(iso)
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩"

/** Ticket IDs are shown in Arabic-Indic digits; searches accept either digit set. */
export function formatId(id: string) {
  return id.replace(/[0-9]/g, (digit) => ARABIC_DIGITS[Number(digit)])
}

export function toLatinDigits(text: string) {
  return text.replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
}

/** Folds common Arabic letter variants so search ignores hamza and taa marbuta spelling. */
export function normalizeArabic(text: string) {
  return toLatinDigits(text)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .trim()
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${formatNumber(bytes)} بايت`
  if (bytes < 1024 * 1024) return `${formatNumber(Math.round(bytes / 1024))} ك.ب`
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} م.ب`
}
