import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

function pageList(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const set = new Set([1, pages, page - 1, page, page + 1])
  const sorted = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b)
  const out: (number | "gap")[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap")
    out.push(p)
  })
  return out
}

export function TablePagination({ page, pageSize, total, onPageChange, className }: TablePaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  return (
    <nav
      aria-label="التنقل بين الصفحات"
      className={cn("flex flex-col items-center justify-between gap-3 border-t border-line-soft px-5 py-3.5 sm:flex-row", className)}
    >
      <p className="tabular text-[13px] text-muted-foreground">
        عرض {formatNumber(start)}–{formatNumber(end)} من {formatNumber(total)} ملاحظة
      </p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="الصفحة السابقة">
            <ChevronRight className="size-4" />
          </Button>
          {pageList(page, pages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-faint" aria-hidden>
                …
              </span>
            ) : (
              <Button
                key={p}
                variant="ghost"
                size="icon-sm"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`الصفحة ${p}`}
                className={cn("tabular text-[13px]", p === page && "bg-brand text-white hover:bg-brand hover:text-white")}
              >
                {formatNumber(p)}
              </Button>
            ),
          )}
          <Button variant="ghost" size="icon-sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="الصفحة التالية">
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      )}
    </nav>
  )
}
