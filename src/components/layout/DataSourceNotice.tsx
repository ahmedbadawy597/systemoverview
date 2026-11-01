import { Info } from "lucide-react"
import { resolveMode } from "@/services/api/transport"

/** Visible only while no Apps Script endpoint is configured, so sample data is never mistaken for the sheet. */
export function DataSourceNotice() {
  if (resolveMode() !== "mock") return null
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-lg border border-[#ecdcae] bg-[#fbf6e8] px-4 py-2.5 text-[13px] leading-6 text-[#5e4a12] print:hidden"
    >
      <Info className="mt-1 size-4 flex-none" aria-hidden />
      <p>
        <span className="font-bold">وضع العرض التجريبي.</span> لم يتم ضبط رابط Google Apps Script بعد، لذلك تُعرض بيانات
        نموذجية ولا تُحفظ التغييرات بعد إعادة تحميل الصفحة.
      </p>
    </div>
  )
}
