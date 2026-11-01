import { RefreshCw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  error?: unknown
  onRetry?: () => void
  retrying?: boolean
  className?: string
}

export function ErrorState({ title = "تعذّر تحميل الملاحظات", error, onRetry, retrying, className }: ErrorStateProps) {
  const message = error instanceof Error && error.message ? error.message : "حدث خطأ أثناء الاتصال بالخادم."
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-[#f1c9c5] bg-[#fdf3f2] p-5 sm:flex-row sm:items-center",
        className,
      )}
    >
      <TriangleAlert className="size-5 flex-none text-danger" aria-hidden />
      <div className="grid flex-1 gap-0.5">
        <p className="font-bold text-[#7a1616]">{title}</p>
        <p className="text-[13px] leading-6 text-[#7a1616]/85">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          <RefreshCw className={cn(retrying && "animate-spin")} aria-hidden />
          إعادة المحاولة
        </Button>
      )}
    </div>
  )
}
