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
import { reportsApi } from "@/services/api/reportsApi"
import { useAuth } from "@/services/auth/AuthProvider"

interface PrintRequest {
  filters?: TicketFilters
}

const Ctx = createContext<{ requestPrint: (request?: PrintRequest) => void } | null>(null)

export function PrintReportProvider({ children }: { children: ReactNode }) {
  const { ensure } = useAuth()
  const [request, setRequest] = useState<PrintRequest | null>(null)
  const [includeImages, setIncludeImages] = useState(false)
  const [busy, setBusy] = useState(false)

  const requestPrint = useCallback(
    async (next: PrintRequest = {}) => {
      const ok = await ensure("print")
      if (!ok) return
      setIncludeImages(false)
      setRequest(next)
    },
    [ensure],
  )

  async function confirmPrint() {
    if (!request) return
    setBusy(true)
    try {
      const filters = request.filters ?? EMPTY_FILTERS
      const result = await reportsApi.generateNotesPdf(filters, includeImages)
      toast.success("تم إصدار التقرير الرسمي")
      window.open(result.url, "_blank", "noopener,noreferrer")
      setRequest(null)
    } catch (error) {
      toast.error("تعذّر إصدار التقرير", {
        description: error instanceof Error ? error.message : undefined,
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
            <DialogDescription>يُنشئ الخادم ملف PDF رسميًا وفق نطاق الفلاتر — متاح لمن لديه صلاحية التقارير.</DialogDescription>
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
              />
              <Label htmlFor="print-include-images" className="grid gap-0.5 text-[13px] leading-6 font-medium">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-faint" aria-hidden />
                  إرفاق صور الملاحظات
                </span>
                <span className="text-xs font-normal text-muted-foreground">قد يزيد حجم الملف ووقت التوليد</span>
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRequest(null)} disabled={busy}>
              إلغاء
            </Button>
            <Button type="button" onClick={() => void confirmPrint()} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : null}
              تحميل PDF
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
