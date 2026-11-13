import { LOGO_SRC } from "@/components/brand/Logo"
import { formatDateTime, formatNumber } from "@/lib/format"

export type CredentialsPrintRow = {
  key: string
  appName: string
  label: string
  url: string
  username: string
  password: string
}

interface CredentialsPrintDocumentProps {
  rows: CredentialsPrintRow[]
  generatedAt: string
  appCount: number
}

/** Screen-hidden printable document; visible only under @media print via .print-root. */
export function CredentialsPrintDocument({
  rows,
  generatedAt,
  appCount,
}: CredentialsPrintDocumentProps) {
  return (
    <div className="print-root credentials-print" aria-hidden="true">
      <header className="credentials-print-header">
        <img src={LOGO_SRC} alt="" width={72} height={72} />
        <div className="credentials-print-org">
          <p className="credentials-print-country">جمهورية مصر العربية</p>
          <p className="credentials-print-ministry">وزارة الأوقاف</p>
          <p className="credentials-print-system">مشروع التحول الرقمي — منظومة المتابعة الفنية</p>
        </div>
        <div className="credentials-print-meta">
          <p>
            <strong>تاريخ الاستخراج</strong>
          </p>
          <p>{formatDateTime(generatedAt)}</p>
          <p>
            {formatNumber(rows.length)} واجهة · {formatNumber(appCount)} تطبيق
          </p>
        </div>
      </header>

      <h1 className="credentials-print-title">تقرير بيانات الوصول والحسابات للأنظمة</h1>
      <p className="credentials-print-scope">سري — للاستخدام الفني الداخلي فقط</p>

      {rows.length === 0 ? (
        <p className="credentials-print-empty">لا توجد واجهات مسجّلة ضمن نطاق هذا التقرير.</p>
      ) : (
        <table className="credentials-print-table">
          <thead>
            <tr>
              <th className="num">#</th>
              <th>اسم التطبيق</th>
              <th>الواجهة المستهدفة</th>
              <th>الرابط المخصص</th>
              <th>اسم المستخدم</th>
              <th>كلمة المرور</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.key}>
                <td className="num">{formatNumber(index + 1)}</td>
                <td className="app-name">{row.appName}</td>
                <td>{row.label}</td>
                <td className="mono" dir="ltr">
                  {row.url || "—"}
                </td>
                <td className="mono" dir="ltr">
                  {row.username || "—"}
                </td>
                <td className="mono" dir="ltr">
                  {row.password || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="credentials-print-footer">
        صدر هذا التقرير آليًا من نظام إدارة الملاحظات — وزارة الأوقاف المصرية.
      </p>
    </div>
  )
}
