import { useEffect, useState } from "react"
import { CalendarDays, FilterX, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { hasActiveFilters, type TicketFilters } from "@/domain/stats"
import { APPROVAL_LABELS, APPROVAL_ORDER, DEV_LABELS, DEV_ORDER } from "@/domain/ticket"
import { cn } from "@/lib/utils"

type FilterField = "query" | "approval" | "devStatus" | "dates"

interface NoteFiltersProps {
  filters: TicketFilters
  onChange: (patch: Partial<TicketFilters>) => void
  onClear: () => void
  fields?: FilterField[]
  searchPlaceholder?: string
  className?: string
}

export function NoteFilters({
  filters,
  onChange,
  onClear,
  fields = ["query", "approval", "devStatus", "dates"],
  searchPlaceholder = "ابحث باسم الملاحظة أو وصفها أو رقمها…",
  className,
}: NoteFiltersProps) {
  const [query, setQuery] = useState(filters.query)

  useEffect(() => setQuery(filters.query), [filters.query])
  useEffect(() => {
    if (query === filters.query) return
    const id = setTimeout(() => onChange({ query }), 220)
    return () => clearTimeout(id)
  }, [query, filters.query, onChange])

  const show = (f: FilterField) => fields.includes(f)
  const active = hasActiveFilters(filters)

  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      {show("query") && (
        <div className="grid min-w-[min(100%,260px)] flex-[1_1_260px] gap-1.5">
          <Label htmlFor="filter-q" className="text-xs font-semibold text-muted-foreground">
            البحث
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <Input
              id="filter-q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="ps-9"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 max-sm:w-full">
        {show("approval") && (
          <div className="grid min-w-[160px] flex-1 gap-1.5 sm:flex-none">
            <Label className="text-xs font-semibold text-muted-foreground" id="filter-approval-label">
              حالة التصديق
            </Label>
            <Select value={filters.approval} onValueChange={(v) => onChange({ approval: v as TicketFilters["approval"] })}>
              <SelectTrigger className="w-full sm:w-[170px]" aria-labelledby="filter-approval-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">كل الحالات</SelectItem>
                {APPROVAL_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {APPROVAL_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {show("devStatus") && (
          <div className="grid min-w-[160px] flex-1 gap-1.5 sm:flex-none">
            <Label className="text-xs font-semibold text-muted-foreground" id="filter-dev-label">
              حالة المبرمجين
            </Label>
            <Select value={filters.devStatus} onValueChange={(v) => onChange({ devStatus: v as TicketFilters["devStatus"] })}>
              <SelectTrigger className="w-full sm:w-[180px]" aria-labelledby="filter-dev-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">كل الحالات</SelectItem>
                {DEV_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {DEV_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {show("dates") && (
          <fieldset className="grid min-w-0 flex-1 gap-1.5 max-sm:basis-full sm:flex-none">
            <legend className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden />
              تاريخ الإضافة
            </legend>
            <div className="flex min-w-0 items-center gap-2">
              <Input
                type="date"
                aria-label="من تاريخ"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => onChange({ from: e.target.value })}
                className="tabular w-full min-w-0 flex-1 sm:w-[140px] sm:flex-none"
              />
              <span className="text-xs text-muted-foreground">إلى</span>
              <Input
                type="date"
                aria-label="إلى تاريخ"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(e) => onChange({ to: e.target.value })}
                className="tabular w-full min-w-0 flex-1 sm:w-[140px] sm:flex-none"
              />
            </div>
          </fieldset>
        )}

        <Button variant="ghost" onClick={onClear} disabled={!active} className="text-muted-foreground hover:text-foreground">
          <FilterX aria-hidden />
          مسح الفلاتر
        </Button>
      </div>
    </div>
  )
}
