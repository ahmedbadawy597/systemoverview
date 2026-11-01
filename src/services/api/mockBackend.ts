import type { BackendFunction } from "./transport"

/**
 * In-memory stand-in used ONLY while no Apps Script endpoint is configured. It mirrors the
 * backend's function names and returns sheet-shaped rows (Arabic labels), so the same normalizer
 * runs in both cases. Nothing is persisted: a reload restores the sample set.
 */

type SheetRow = {
  id: string
  name: string
  description: string
  images: string[]
  date: string
  approval: string
  approvedAt: string
  devStatus: string
  devNotes: string
  devUpdatedAt: string
}

const DAY = 86_400_000

function daysAgo(days: number, hour = 10, minute = 0) {
  const d = new Date(Date.now() - days * DAY)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function screenSketch(title: string, accent: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
<rect width="960" height="600" fill="#f7f9f8"/>
<rect x="0" y="0" width="960" height="64" fill="#14533d"/>
<rect x="736" y="20" width="200" height="24" rx="4" fill="#c5a869"/>
<rect x="736" y="96" width="200" height="472" rx="8" fill="#ffffff" stroke="#e2e8e5"/>
<rect x="760" y="124" width="152" height="14" rx="3" fill="#e2e8e5"/>
<rect x="760" y="156" width="120" height="14" rx="3" fill="#e2e8e5"/>
<rect x="760" y="188" width="140" height="14" rx="3" fill="#e2e8e5"/>
<rect x="24" y="96" width="688" height="200" rx="8" fill="#ffffff" stroke="#e2e8e5"/>
<rect x="48" y="124" width="320" height="20" rx="4" fill="#1e2939" opacity="0.85"/>
<rect x="48" y="164" width="600" height="12" rx="3" fill="#bec9c3"/>
<rect x="48" y="190" width="540" height="12" rx="3" fill="#bec9c3"/>
<rect x="48" y="236" width="140" height="36" rx="6" fill="${accent}"/>
<rect x="24" y="320" width="688" height="248" rx="8" fill="#ffffff" stroke="#e2e8e5"/>
<rect x="48" y="352" width="640" height="10" rx="3" fill="#edf1ef"/>
<rect x="48" y="392" width="640" height="10" rx="3" fill="#edf1ef"/>
<rect x="48" y="432" width="640" height="10" rx="3" fill="#edf1ef"/>
<rect x="420" y="456" width="268" height="72" rx="6" fill="none" stroke="#ba1a1a" stroke-width="4" stroke-dasharray="10 8"/>
<text x="688" y="140" font-family="Tahoma" font-size="18" fill="#1e2939" text-anchor="end">${title}</text>
</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const seed: SheetRow[] = [
  {
    id: "1014",
    name: "تأخر ظهور مواقيت الصلاة في الصفحة الرئيسية",
    description:
      "عند فتح البوابة من الهاتف تظهر مواقيت الصلاة بعد ثماني ثوانٍ تقريبًا، وأحيانًا تظهر فارغة حتى إعادة تحميل الصفحة. تكررت الملاحظة على شبكات الجوال في محافظتي أسيوط وسوهاج.",
    images: [screenShotOf("مواقيت الصلاة")],
    date: daysAgo(0, 9, 40),
    approval: "بانتظار التصديق",
    approvedAt: "",
    devStatus: "لم تتم المراجعة",
    devNotes: "",
    devUpdatedAt: "",
  },
  {
    id: "1013",
    name: "خطأ في التاريخ الهجري بنموذج طلب تصريح الخطابة",
    description:
      "يظهر التاريخ الهجري متأخرًا يومًا واحدًا عن التقويم المعتمد من دار الإفتاء في نموذج طلب تصريح الخطابة، مما يسبب لبسًا عند تحديد موعد المقابلة.",
    images: [],
    date: daysAgo(1, 13, 15),
    approval: "بانتظار التصديق",
    approvedAt: "",
    devStatus: "لم تتم المراجعة",
    devNotes: "",
    devUpdatedAt: "",
  },
  {
    id: "1012",
    name: "عدم ظهور زر الطباعة في شهادة إتمام الدورة التدريبية",
    description:
      "بعد اجتياز الأئمة لاختبار الدورة التدريبية تظهر الشهادة دون زر الطباعة على متصفح سفاري، بينما يظهر الزر على كروم.",
    images: [screenShotOf("شهادة إتمام الدورة")],
    date: daysAgo(2, 11, 5),
    approval: "بانتظار التصديق",
    approvedAt: "",
    devStatus: "لم تتم المراجعة",
    devNotes: "",
    devUpdatedAt: "",
  },
  {
    id: "1011",
    name: "بطء البحث في دليل المساجد بالمحافظات",
    description:
      "البحث باسم المسجد في دليل المساجد يستغرق أكثر من خمس ثوانٍ عند اختيار محافظة القاهرة، ولا تظهر رسالة تحميل أثناء الانتظار.",
    images: [],
    date: daysAgo(4, 10, 30),
    approval: "تم التصديق",
    approvedAt: daysAgo(3, 12, 0),
    devStatus: "قيد الدراسة",
    devNotes: "تم رصد استعلام غير مفهرس على جدول المساجد. جارٍ إضافة فهرس على عمودي المحافظة والاسم واختباره على بيئة التجربة.",
    devUpdatedAt: daysAgo(2, 15, 20),
  },
  {
    id: "1010",
    name: "تكرار إرسال رسالة التحقق عند تسجيل الدخول",
    description:
      "يصل للمستخدم رمز التحقق مرتين أو ثلاث مرات عند الضغط على زر الدخول مرة واحدة، مما يؤدي إلى رفض الرمز الأول.",
    images: [],
    date: daysAgo(6, 9, 0),
    approval: "بانتظار التصديق",
    approvedAt: "",
    devStatus: "لم تتم المراجعة",
    devNotes: "",
    devUpdatedAt: "",
  },
  {
    id: "1009",
    name: "اختلاف عدد المساجد بين التقرير الشهري ولوحة المتابعة",
    description:
      "يعرض التقرير الشهري لمديرية الجيزة ٤٬١٢٠ مسجدًا بينما تعرض لوحة المتابعة ٤٬٠٩٨ مسجدًا لنفس الفترة.",
    images: [screenShotOf("التقرير الشهري")],
    date: daysAgo(9, 14, 10),
    approval: "تم التصديق",
    approvedAt: daysAgo(8, 10, 45),
    devStatus: "قيد الدراسة",
    devNotes: "الفرق ناتج عن احتساب المساجد الموقوفة مؤقتًا في التقرير فقط. بانتظار قرار الإدارة بشأن طريقة الاحتساب المعتمدة.",
    devUpdatedAt: daysAgo(5, 11, 0),
  },
  {
    id: "1008",
    name: "انقطاع رفع ملفات خطبة الجمعة الأكبر من ٥ ميجابايت",
    description:
      "يتوقف رفع ملف الخطبة بصيغة PDF عند حجم يزيد على خمسة ميجابايت دون رسالة خطأ واضحة للمستخدم.",
    images: [],
    date: daysAgo(13, 12, 0),
    approval: "تم التصديق",
    approvedAt: daysAgo(12, 9, 30),
    devStatus: "تم تلافي الملاحظة",
    devNotes: "تم رفع الحد الأقصى إلى ٢٠ ميجابايت وإضافة رسالة توضح الحجم المسموح به. تم النشر على البيئة الفعلية.",
    devUpdatedAt: daysAgo(10, 16, 0),
  },
  {
    id: "1007",
    name: "ظهور أسماء المديريات باللغة الإنجليزية في القائمة المنسدلة",
    description:
      "في صفحة تقارير المديريات تظهر بعض أسماء المديريات بالإنجليزية بدلًا من العربية بعد آخر تحديث للنظام.",
    images: [],
    date: daysAgo(18, 10, 20),
    approval: "تم التصديق",
    approvedAt: daysAgo(17, 13, 0),
    devStatus: "تم تلافي الملاحظة",
    devNotes: "تم تصحيح ملف الترجمة وإضافة الأسماء الناقصة لعدد سبع مديريات.",
    devUpdatedAt: daysAgo(15, 12, 10),
  },
  {
    id: "1006",
    name: "عدم توافق صفحة الأوقاف الخيرية مع شاشات الهاتف",
    description:
      "جدول بيانات الأوقاف الخيرية يتجاوز عرض الشاشة على الهاتف ويتطلب التمرير أفقيًا لقراءة عمود القيمة.",
    images: [screenShotOf("الأوقاف الخيرية")],
    date: daysAgo(25, 11, 40),
    approval: "تم التصديق",
    approvedAt: daysAgo(24, 10, 0),
    devStatus: "قيد الدراسة",
    devNotes: "سيتم تحويل الجدول إلى بطاقات على الشاشات الصغيرة ضمن الإصدار القادم.",
    devUpdatedAt: daysAgo(20, 14, 30),
  },
  {
    id: "1005",
    name: "خطأ إملائي في عنوان صفحة المسابقة القرآنية",
    description: "ورد عنوان الصفحة «المسابقه القرآنيه» بالهاء بدلًا من التاء المربوطة.",
    images: [],
    date: daysAgo(33, 9, 15),
    approval: "تم التصديق",
    approvedAt: daysAgo(33, 12, 0),
    devStatus: "تم تلافي الملاحظة",
    devNotes: "تم التصحيح.",
    devUpdatedAt: daysAgo(32, 10, 0),
  },
  {
    id: "1004",
    name: "عدم وصول إشعار اعتماد طلب صيانة المسجد",
    description:
      "بعد اعتماد طلب صيانة المسجد من مدير الإدارة لا يصل إشعار للإمام مقدم الطلب، ويظل الطلب «قيد المراجعة» في حسابه.",
    images: [],
    date: daysAgo(41, 13, 50),
    approval: "تم التصديق",
    approvedAt: daysAgo(40, 9, 0),
    devStatus: "لم تتم المراجعة",
    devNotes: "",
    devUpdatedAt: "",
  },
  {
    id: "1003",
    name: "تعطل تصدير كشف الأئمة إلى ملف Excel",
    description:
      "عند تصدير كشف الأئمة لأكثر من ألف اسم يظهر ملف فارغ، بينما يعمل التصدير لعدد أقل.",
    images: [],
    date: daysAgo(52, 10, 0),
    approval: "تم التصديق",
    approvedAt: daysAgo(51, 11, 30),
    devStatus: "تم تلافي الملاحظة",
    devNotes: "تم تقسيم التصدير على دفعات، وأصبح الكشف الكامل (٣٬٢٤٠ اسمًا) يُصدّر في أقل من عشر ثوانٍ.",
    devUpdatedAt: daysAgo(46, 15, 45),
  },
  {
    id: "1002",
    name: "صورة الشعار غير واضحة في رأس الصفحات المطبوعة",
    description: "يظهر شعار الوزارة مشوشًا في رأس التقارير المطبوعة من النظام القديم.",
    images: [],
    date: daysAgo(64, 12, 30),
    approval: "بانتظار التصديق",
    approvedAt: "",
    devStatus: "لم تتم المراجعة",
    devNotes: "",
    devUpdatedAt: "",
  },
  {
    id: "1001",
    name: "انتهاء الجلسة أثناء تعبئة نموذج بيانات المسجد",
    description:
      "تنتهي الجلسة بعد عشر دقائق أثناء تعبئة نموذج بيانات المسجد الطويل، وتضيع البيانات المدخلة.",
    images: [],
    date: daysAgo(78, 11, 0),
    approval: "تم التصديق",
    approvedAt: daysAgo(77, 10, 0),
    devStatus: "تم تلافي الملاحظة",
    devNotes: "تم تمديد الجلسة إلى ٣٠ دقيقة مع حفظ مسودة تلقائي كل دقيقتين.",
    devUpdatedAt: daysAgo(70, 13, 0),
  },
]

function screenShotOf(title: string) {
  return screenSketch(title, "#0b735d")
}

let rows: SheetRow[] = seed.map((row) => ({ ...row, images: [...row.images] }))

function wait<T>(value: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function findRow(id: unknown) {
  const row = rows.find((r) => r.id === String(id))
  if (!row) throw new Error("الملاحظة غير موجودة.")
  return row
}

export const mockBackend = {
  async call(fn: BackendFunction, args: unknown[]): Promise<unknown> {
    switch (fn) {
      case "fetchTickets":
        return wait(rows.map((row) => ({ ...row, images: [...row.images] })), 650)

      case "addTicketToSheet": {
        const input = (args[0] ?? {}) as { name?: string; description?: string; images?: string[] }
        const nextId = String(Math.max(0, ...rows.map((r) => Number(r.id) || 0)) + 1)
        const row: SheetRow = {
          id: nextId,
          name: String(input.name ?? ""),
          description: String(input.description ?? ""),
          images: Array.isArray(input.images) ? input.images : [],
          date: new Date().toISOString(),
          approval: "بانتظار التصديق",
          approvedAt: "",
          devStatus: "لم تتم المراجعة",
          devNotes: "",
          devUpdatedAt: "",
        }
        rows = [row, ...rows]
        return wait({ ...row }, 900)
      }

      case "approveTicketInSheet": {
        const row = findRow(args[0])
        row.approval = "تم التصديق"
        row.approvedAt = new Date().toISOString()
        return wait(true)
      }

      case "updateDevInSheet": {
        const row = findRow(args[0])
        row.devStatus = String(args[1] ?? row.devStatus)
        row.devNotes = String(args[2] ?? "")
        row.devUpdatedAt = new Date().toISOString()
        return wait(true)
      }

      case "deleteTicketFromSheet": {
        findRow(args[0])
        rows = rows.filter((r) => r.id !== String(args[0]))
        return wait(true)
      }
    }
  },
}
