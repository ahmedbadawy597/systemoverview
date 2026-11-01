import { useEffect, useMemo, useState } from "react"
import { FileText, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { StatusBadge } from "@/components/notes/StatusBadge"
import { useTickets } from "@/hooks/useTickets"
import { formatId, normalizeArabic } from "@/lib/format"
import { cn } from "@/lib/utils"

export function SearchCommand({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { data = [], isLoading } = useTickets()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const results = useMemo(() => {
    const q = normalizeArabic(query)
    const list = q ? data.filter((t) => normalizeArabic(`${t.id} ${t.name} ${t.description}`).includes(q)) : data
    return list.slice(0, 8)
  }, [data, query])

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-10 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 text-[13px] text-muted-foreground transition-colors hover:border-input-border hover:text-foreground",
          className,
        )}
        aria-label="البحث في الملاحظات"
      >
        <Search className="size-4 flex-none" aria-hidden />
        <span className="hidden flex-1 text-start md:inline">ابحث برقم أو اسم الملاحظة…</span>
        <kbd className="hidden rounded border border-line bg-surface-soft px-1.5 font-sans text-[11px] text-muted-foreground md:inline" dir="ltr">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery("")
        }}
        title="البحث في الملاحظات"
        description="ابحث برقم الملاحظة أو اسمها أو وصفها"
        className="sm:max-w-xl"
        shouldFilter={false}
      >
        <CommandInput placeholder="ابحث برقم أو اسم الملاحظة…" value={query} onValueChange={setQuery} />
        <CommandList className="max-h-[min(420px,60vh)]">
          <CommandEmpty>{isLoading ? "جارٍ تحميل الملاحظات…" : "لا توجد ملاحظات مطابقة لبحثك."}</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading={query ? "النتائج" : "أحدث الملاحظات"}>
              {results.map((t) => (
                <CommandItem
                  key={t.id}
                  value={t.id}
                  onSelect={() => {
                    setOpen(false)
                    setQuery("")
                    navigate(`/notes/${t.id}`)
                  }}
                  className="gap-3 py-2.5"
                >
                  <FileText className="size-4 text-faint" aria-hidden />
                  <span className="tabular w-12 flex-none text-xs text-muted-foreground">{formatId(t.id)}</span>
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  <StatusBadge kind="approval" value={t.approval} className="hidden sm:inline-flex" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
