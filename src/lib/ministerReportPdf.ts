import { LOGO_SRC } from "@/components/brand/Logo"

export type MinisterReportPdfInput = {
  period: string
  title: string
  scope: string
  summary: string
  metrics: { label: string; value: string }[]
  highlights: string[]
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

/** Opens a print-ready A4 document the browser can Save as PDF. */
export function openMinisterReportPdf(report: MinisterReportPdfInput) {
  const issuedAt = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date())

  const logoUrl = new URL(LOGO_SRC, window.location.href).href
  const metrics = report.metrics
    .map(
      (metric) => `
      <div class="metric">
        <strong>${escapeHtml(metric.value)}</strong>
        <span>${escapeHtml(metric.label)}</span>
      </div>`,
    )
    .join("")

  const highlights = report.highlights
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("")

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)} — وزارة الأوقاف المصرية</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4 portrait; margin: 16mm 14mm 18mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Amiri, "Times New Roman", "Traditional Arabic", serif;
      color: #1e2939;
      background: #edf1ef;
      line-height: 1.75;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 2;
      display: flex;
      gap: 10px;
      justify-content: center;
      padding: 12px;
      background: rgba(255,255,255,0.92);
      border-bottom: 1px solid #e2e8e5;
      backdrop-filter: blur(8px);
    }
    .toolbar button {
      font: inherit;
      font-weight: 700;
      border-radius: 8px;
      border: 1px solid #bec9c3;
      background: #fff;
      color: #1e2939;
      padding: 10px 16px;
      cursor: pointer;
    }
    .toolbar .primary {
      border-color: transparent;
      background: #0b735d;
      color: #fff;
    }
    .sheet {
      width: min(210mm, 100% - 24px);
      margin: 18px auto 28px;
      background: #fff;
      border: 1px solid #d7e0db;
      box-shadow: 0 18px 40px -20px rgba(15,58,50,0.28);
      padding: 18mm 16mm;
    }
    .header {
      display: grid;
      grid-template-columns: 26mm 1fr 46mm;
      gap: 12px;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 2.5px double #a18841;
    }
    .header img {
      width: 24mm;
      height: 24mm;
      object-fit: contain;
      display: block;
    }
    .org {
      font-family: Amiri, "Times New Roman", "Traditional Arabic", serif;
      text-align: center;
    }
    .org .country { font-size: 17pt; font-weight: 700; color: #0f3a32; margin: 0; line-height: 1.55; }
    .org .ministry { font-size: 15pt; font-weight: 700; color: #14533d; margin: 2px 0 0; line-height: 1.55; }
    .org .system { font-size: 11pt; color: #5c6863; margin: 4px 0 0; font-family: Amiri, serif; }
    .meta { text-align: start; font-size: 9pt; color: #5c6863; }
    .meta strong { display: block; color: #1e2939; font-size: 10.5pt; margin-bottom: 4px; }
    .title {
      margin: 18px 0 8px;
      text-align: center;
      font-family: Amiri, "Times New Roman", "Traditional Arabic", serif;
      font-size: 24pt;
      font-weight: 700;
      color: #0f3a32;
      line-height: 1.55;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 9.5pt;
      font-weight: 700;
      background: #e8f0ec;
      color: #14533d;
      border: 1px solid rgba(20,83,61,0.12);
    }
    .badge.gold {
      background: #f7efd9;
      color: #6a5216;
      border-color: rgba(161,136,65,0.25);
    }
    .summary {
      margin: 0 0 18px;
      font-size: 11pt;
      color: #3d4945;
      text-align: justify;
    }
    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .metric {
      border: 1px solid #d7e0db;
      border-radius: 10px;
      background: #f8faf9;
      padding: 12px 10px;
      text-align: center;
    }
    .metric strong {
      display: block;
      font-size: 18pt;
      color: #0f3a32;
      font-variant-numeric: tabular-nums;
    }
    .metric span {
      display: block;
      margin-top: 6px;
      font-size: 9.5pt;
      font-weight: 700;
      color: #5c6863;
    }
    .panel {
      border: 1px solid #d7e0db;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .panel h2 {
      margin: 0 0 10px;
      font-size: 12pt;
      color: #0f3a32;
    }
    .panel ol {
      margin: 0;
      padding: 0 18px 0 0;
    }
    .panel li {
      margin: 0 0 8px;
      font-size: 10.5pt;
      color: #3d4945;
    }
    .footer-note {
      margin-top: 22px;
      padding-top: 12px;
      border-top: 1px solid #e2e8e5;
      font-size: 8.5pt;
      color: #6e7a75;
      text-align: center;
    }
    @media print {
      body { background: #fff; }
      .toolbar { display: none !important; }
      .sheet {
        width: auto;
        margin: 0;
        border: 0;
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="primary" type="button" onclick="window.print()">طباعة / حفظ PDF</button>
    <button type="button" onclick="window.close()">إغلاق</button>
  </div>
  <article class="sheet">
    <header class="header">
      <img src="${escapeHtml(logoUrl)}" alt="شعار وزارة الأوقاف المصرية" />
      <div class="org">
        <p class="country">جمهورية مصر العربية</p>
        <p class="ministry">وزارة الأوقاف</p>
        <p class="system">لوحة معالي وزير الأوقاف</p>
      </div>
      <div class="meta">
        <strong>تقرير نجاح</strong>
        <div>تاريخ الإصدار: ${escapeHtml(issuedAt)}</div>
        <div>النطاق: ${escapeHtml(report.scope)}</div>
      </div>
    </header>
    <h1 class="title">${escapeHtml(report.title)}</h1>
    <div class="badges">
      <span class="badge">${escapeHtml(report.period)}</span>
      <span class="badge gold">نسخة تجريبية</span>
    </div>
    <p class="summary">${escapeHtml(report.summary)}</p>
    <div class="metrics">${metrics}</div>
    <section class="panel">
      <h2>أبرز النقاط</h2>
      <ol>${highlights}</ol>
    </section>
    <p class="footer-note">وزارة الأوقاف المصرية · مستند تجريبي للعرض · يمكن حفظه كملف PDF من نافذة الطباعة</p>
  </article>
  <script>
    window.addEventListener('load', async () => {
      try { await document.fonts.ready } catch (_) {}
      setTimeout(() => window.print(), 350)
    })
  </script>
</body>
</html>`

  const popup = window.open("", "_blank")
  if (!popup) return false
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  return true
}
