import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { FileText, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { AdminPasswordModal } from "@/components/auth/AdminPasswordModal"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { EMPTY_FILTERS, type TicketFilters } from "@/domain/stats"
import type { Ticket } from "@/domain/ticket"
import { formatNumber } from "@/lib/format"
import { PrintReport } from "./PrintReport"

interface PrintRequest {
  tickets: Ticket[]
  filters?: TicketFilters
}

interface PrintJob {
  tickets: Ticket[]
  filters: TicketFilters
  includeImages: boolean
  generatedAt: string
}

const Ctx = createContext<{ requestPrint: (request: PrintRequest) => void } | null>(null)

function waitForImages(root: HTMLElement, timeoutMs = 5000) {
  const pending = Array.from(root.querySelectorAll("img")).filter((img) => !img.complete)
  if (pending.length === 0) return Promise.resolve()
  return Promise.race([
    Promise.all(
      pending.map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true })
            img.addEventListener("error", () => resolve(), { once: true })
          }),
      ),
    ),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]).then(() => undefined)
}

export function PrintReportProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<PrintRequest | null>(null)
  const [includeImages, setIncludeImages] = useState(false)
  const [job, setJob] = useState<PrintJob | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const requestPrint = useCallback((next: PrintRequest) => {
    setIncludeImages(false)
    setRequest(next)
  }, [])

  useEffect(() => {
    if (!job || !reportRef.current) return
    let cancelled = false
    const done = () => setJob(null)
    window.addEventListener("afterprint", done, { once: true })
    void Promise.all([document.fonts?.ready, waitForImages(reportRef.current)]).then(() => {
      if (!cancelled) window.print()
    })
    return () => {
      cancelled = true
      window.removeEventListener("afterprint", done)
    }
  }, [job])

  const imageCount = request?.tickets.reduce((n, t) => n + t.images.length, 0) ?? 0

  return (
    <Ctx.Provider value={{ requestPrint }}>
      {children}

      <AdminPasswordModal
        open={request !== null}
        title="طباعة التقرير"
        description="طباعة التقارير متاحة للمدير فقط. أدخل كلمة مرور المدير لإصدار التقرير."
        confirmLabel="إصدار التقرير"
        onCancel={() => setRequest(null)}
        onVerified={() => {
          if (!request) return
          if (request.tickets.length === 0) toast.info("سيتم إصدار تقرير فارغ لعدم وجود ملاحظات ضمن النطاق المحدد.")
          setJob({
            tickets: request.tickets,
            filters: request.filters ?? EMPTY_FILTERS,
            includeImages,
            generatedAt: new Date().toISOString(),
          })
          setRequest(null)
        }}
      >
        <div className="grid gap-3 rounded-lg bg-surface-soft p-4">
          <p className="flex items-center gap-2 text-[13px] text-foreground">
            <FileText className="size-4 text-brand" aria-hidden />
            يتضمن التقرير <span className="tabular font-bold">{formatNumber(request?.tickets.length ?? 0)}</span> ملاحظة، بمقاس A4.
          </p>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="print-include-images"
              checked={includeImages}
              onCheckedChange={(v) => setIncludeImages(v === true)}
              disabled={imageCount === 0}
              className="mt-0.5"
            />
            <Label htmlFor="print-include-images" className="grid gap-0.5 text-[13px] leading-6 font-medium">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-faint" aria-hidden />
                إرفاق صور الملاحظات
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {imageCount > 0 ? `${formatNumber(imageCount)} صورة تُضاف في نهاية التقرير` : "لا توجد صور مرفقة في هذه الملاحظات"}
              </span>
            </Label>
          </div>
        </div>
      </AdminPasswordModal>

      {job &&
        createPortal(
          <div className="print-root" aria-hidden>
            <PrintReport ref={reportRef} {...job} />
          </div>,
          document.body,
        )}
    </Ctx.Provider>
  )
}

export function usePrintReport() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("usePrintReport must be used inside PrintReportProvider")
  return ctx
}
