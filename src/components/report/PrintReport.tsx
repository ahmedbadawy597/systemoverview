import { forwardRef } from "react"
import { LOGO_SRC } from "@/components/brand/Logo"
import { AuthenticatedImage } from "@/components/notes/AuthenticatedImage"
import { computeStats, type TicketFilters } from "@/domain/stats"
import { APPROVAL_LABELS, DEV_LABELS, type Ticket } from "@/domain/ticket"
import { formatDate, formatDateTime, formatId, formatNumber, formatShortDate } from "@/lib/format"

export interface PrintReportProps {
  tickets: Ticket[]
  filters: TicketFilters
  generatedAt: string
  includeImages: boolean
}

export function describeScope(filters: TicketFilters) {
  const parts: string[] = []
  if (filters.from || filters.to) {
    parts.push(
      `الفترة: ${filters.from ? `من ${formatDate(filters.from)}` : "منذ البداية"} ${filters.to ? `إلى ${formatDate(filters.to)}` : "حتى اليوم"}`,
    )
  } else {
    parts.push("الفترة: جميع الملاحظات المسجلة")
  }
  parts.push(`حالة التصديق: ${filters.approval === "all" ? "الكل" : APPROVAL_LABELS[filters.approval]}`)
  parts.push(`حالة المبرمجين: ${filters.devStatus === "all" ? "الكل" : DEV_LABELS[filters.devStatus]}`)
  if (filters.query.trim()) parts.push(`بحث: «${filters.query.trim()}»`)
  return parts.join(" · ")
}

export const PrintReport = forwardRef<HTMLDivElement, PrintReportProps>(function PrintReport(
  { tickets, filters, generatedAt, includeImages },
  ref,
) {
  const stats = computeStats(tickets)
  const withImages = includeImages ? tickets.filter((t) => t.images.length > 0) : []

  return (
    <div ref={ref} className="report" lang="ar" dir="rtl">
      <header className="report-header">
        <img src={LOGO_SRC} alt="شعار وزارة الأوقاف المصرية" />
        <div className="report-org">
          <div className="org-country">جمهورية مصر العربية</div>
          <div className="org-name">وزارة الأوقاف</div>
          <div className="org-system">نظام إدارة الملاحظات</div>
        </div>
        <dl className="report-meta">
          <div>
            <dt>تاريخ الإصدار: </dt>
            <dd>{formatDateTime(generatedAt)}</dd>
          </div>
          <div>
            <dt>عدد الملاحظات: </dt>
            <dd>{formatNumber(stats.total)}</dd>
          </div>
        </dl>
      </header>

      <h1 className="report-title">تقرير الملاحظات</h1>
      <p className="report-scope">{describeScope(filters)}</p>

      <h2 className="report-section-title">ملخص إحصائي</h2>
      <table className="report-summary">
        <tbody>
          <tr>
            <SummaryCell label="إجمالي الملاحظات" value={stats.total} />
            <SummaryCell label="تم التصديق" value={stats.approved} />
            <SummaryCell label="بانتظار التصديق" value={stats.pending} />
            <SummaryCell label="قيد الدراسة" value={stats.underStudy} />
            <SummaryCell label="تم تلافيها" value={stats.resolved} />
          </tr>
        </tbody>
      </table>

      <h2 className="report-section-title">تفاصيل الملاحظات</h2>
      {tickets.length === 0 ? (
        <div className="report-empty">لا توجد ملاحظات ضمن نطاق هذا التقرير.</div>
      ) : (
        <table className="report-table">
          <colgroup>
            <col style={{ width: "6%" }} />
            <col style={{ width: "33%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>الرقم</th>
              <th>الملاحظة والوصف</th>
              <th>تاريخ الإضافة</th>
              <th>التصديق</th>
              <th>المبرمجين</th>
              <th>ملاحظات المبرمجين</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td className="num">{formatId(t.id)}</td>
                <td>
                  <div className="note-name">{t.name}</div>
                  {t.description && <div className="note-desc">{t.description}</div>}
                  {t.images.length > 0 && <div className="note-desc">المرفقات: {formatNumber(t.images.length)} صورة</div>}
                </td>
                <td className="num">{formatShortDate(t.createdAt)}</td>
                <td className="status">{APPROVAL_LABELS[t.approval]}</td>
                <td className="status">{DEV_LABELS[t.devStatus]}</td>
                <td>{t.devNotes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {withImages.length > 0 && (
        <>
          <h2 className="report-section-title">الصور المرفقة</h2>
          {withImages.map((t) => (
            <section key={t.id} className="report-images">
              <h3>
                ملاحظة رقم {formatId(t.id)} — {t.name}
              </h3>
              <div className="grid">
                {t.images.map((src, i) => (
                  <AuthenticatedImage key={i} src={src} alt={`صورة ${i + 1} من الملاحظة ${t.id}`} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <p className="report-footer-note">صدر هذا التقرير آليًا من نظام إدارة الملاحظات — وزارة الأوقاف المصرية.</p>
    </div>
  )
})

function SummaryCell({ label, value }: { label: string; value: number }) {
  return (
    <td>
      <span className="value">{formatNumber(value)}</span>
      <span className="label">{label}</span>
    </td>
  )
}
