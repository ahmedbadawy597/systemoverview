import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { FileText, ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { EMPTY_FILTERS, type TicketFilters } from "@/domain/stats"
import {
  isReportTooLargeError,
  isTransientApiError,
  reportErrorDescription,
  reportErrorTitle,
} from "@/lib/apiLoadHardening"
import { reportsApi } from "@/services/api/reportsApi"
import { useAuth } from "@/services/auth/AuthProvider"

interface PrintRequest {
  filters?: TicketFilters
}

const Ctx = createContext<{ requestPrint: (request?: PrintRequest) => void } | null>(null)

function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export function PrintReportProvider({ children }: { children: ReactNode }) {
  const { ensure } = useAuth()
  const [request, setRequest] = useState<PrintRequest | null>(null)
  const [includeImages, setIncludeImages] = useState(false)
  const [busy, setBusy] = useState(false)
  const [statusHint, setStatusHint] = useState<string | null>(null)

  const requestPrint = useCallback(
    async (next: PrintRequest = {}) => {
      const ok = await ensure("print")
      if (!ok) return
      setIncludeImages(false)
      setStatusHint(null)
      setRequest(next)
    },
    [ensure],
  )

  async function confirmPrint() {
    if (!request || busy) return
    setBusy(true)
    setStatusHint("جارٍ إعداد التقرير على الخادم… قد يستغرق ذلك عدة ثوانٍ.")
    try {
      const filters = request.filters ?? EMPTY_FILTERS
      const result = await reportsApi.generateNotesPdf(filters, includeImages)
      triggerBlobDownload(result.blob, result.fileName)
      toast.success("تم إصدار التقرير الرسمي")
      setRequest(null)
      setStatusHint(null)
    } catch (error) {
      if (isReportTooLargeError(error) && includeImages) {
        setIncludeImages(false)
        setStatusHint("تم إلغاء إرفاق الصور تلقائيًا — ضيّق الفلاتر أو أعد المحاولة بدون صور.")
      } else {
        setStatusHint(null)
      }
      toast.error(reportErrorTitle(error), {
        description: reportErrorDescription(error),
        duration: isTransientApiError(error) || isReportTooLargeError(error) ? 8_000 : 5_000,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Ctx.Provider value={{ requestPrint }}>
      {children}

      <Dialog open={request !== null} onOpenChange={(open) => !open && !busy && setRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إصدار التقرير الرسمي</DialogTitle>
            <DialogDescription>
              يُنشئ الخادم ملف PDF رسميًا وفق نطاق الفلاتر — متاح لمن لديه صلاحية التقارير.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 rounded-lg bg-surface-soft p-4">
            <p className="flex items-center gap-2 text-[13px] text-foreground">
              <FileText className="size-4 text-brand" aria-hidden />
              التقرير يطابق تصميم الوزارة ويُحفظ مع سجل الإصدار على الخادم.
            </p>
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="print-include-images"
                checked={includeImages}
                onCheckedChange={(v) => setIncludeImages(v === true)}
                className="mt-0.5"
                disabled={busy}
              />
              <Label htmlFor="print-include-images" className="grid gap-0.5 text-[13px] leading-6 font-medium">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-faint" aria-hidden />
                  إرفاق صور الملاحظات
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  يزيد الحجم ووقت التوليد — الحد الأقصى أصغر عند تفعيل الصور
                </span>
              </Label>
            </div>
            {statusHint ? (
              <p className="rounded-md border border-border/60 bg-background/80 px-3 py-2 text-xs leading-5 text-muted-foreground">
                {busy ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="size-3.5 animate-spin text-brand" aria-hidden />
                    {statusHint}
                  </span>
                ) : (
                  statusHint
                )}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRequest(null)} disabled={busy}>
              إلغاء
            </Button>
            <Button type="button" onClick={() => void confirmPrint()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {busy ? "جارٍ الإصدار…" : "تحميل PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  )
}

export function usePrintReport() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("usePrintReport must be used inside PrintReportProvider")
  return ctx
}
