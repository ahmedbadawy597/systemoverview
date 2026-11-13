import { useEffect, useState, type ReactNode } from "react"
import { ImageIcon } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { TableSkeleton } from "@/components/common/LoadingSkeleton"
import { TablePagination } from "@/components/common/TablePagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Ticket } from "@/domain/ticket"
import { formatId, formatNumber, formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { AuthenticatedImage } from "./AuthenticatedImage"
import { ImageLightbox } from "./ImageLightbox"
import { NoteActionsMenu } from "./NoteActionsMenu"
import { StatusBadge } from "./StatusBadge"

interface NotesTableProps {
  tickets: Ticket[]
  /** "full" is the notes register; "compact" drops description and images for overview lists. */
  variant?: "full" | "compact"
  pageSize?: number
  loading?: boolean
  empty?: ReactNode
  /** Reset to the first page when this value changes (e.g. the active filters). */
  resetKey?: string
  /** Server-driven pagination. When `total` is set, rows are not sliced client-side. */
  page?: number
  total?: number
  onPageChange?: (page: number) => void
}

export function NotesTable({
  tickets,
  variant = "full",
  pageSize,
  loading,
  empty,
  resetKey,
  page: controlledPage,
  total,
  onPageChange,
}: NotesTableProps) {
  const [page, setPage] = useState(1)
  const [preview, setPreview] = useState<{ ticket: Ticket; index: number } | null>(null)
  const navigate = useNavigate()
  const full = variant === "full"
  const wide = useMediaQuery("(min-width: 1280px)")
  const withDescription = full && wide
  const serverPaged = typeof total === "number" && typeof onPageChange === "function"
  const activePage = serverPaged ? (controlledPage ?? 1) : page

  useEffect(() => {
    if (!serverPaged) setPage(1)
  }, [resetKey, serverPaged])
  const pages = pageSize ? Math.max(1, Math.ceil((serverPaged ? total : tickets.length) / pageSize)) : 1
  useEffect(() => {
    if (!serverPaged && page > pages) setPage(pages)
  }, [page, pages, serverPaged])

  const visible = serverPaged || !pageSize ? tickets : tickets.slice((activePage - 1) * pageSize, activePage * pageSize)
  const open = (t: Ticket) => navigate(`/notes/${encodeURIComponent(t.id)}`)
  const changePage = (next: number) => {
    if (serverPaged) onPageChange?.(next)
    else setPage(next)
  }

  if (loading) return <TableSkeleton rows={pageSize ? Math.min(pageSize, 6) : 5} columns={full ? 8 : 6} />
  if (tickets.length === 0) return <div className="p-5">{empty}</div>

  return (
    <>
      {/* Tablet and desktop: a real table */}
      <div className="hidden lg:block">
        <Table className="table-fixed">
          <colgroup>
            <col className={full ? "w-[80px]" : "w-[112px]"} />
            <col className={withDescription ? "w-[22%]" : undefined} />
            {withDescription && <col />}
            {full && <col className="w-[150px]" />}
            {full && <col className="w-[80px]" />}
            <col className={full ? "w-[124px]" : "w-[112px]"} />
            <col className={full ? "w-[140px]" : "w-[128px]"} />
            <col className={full ? "w-[160px]" : "w-[144px]"} />
            <col className="w-[96px]" />
          </colgroup>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{full ? "الرقم" : "رقم الملاحظة"}</TableHead>
              <TableHead>اسم الملاحظة</TableHead>
              {withDescription && <TableHead>الوصف</TableHead>}
              {full && <TableHead>التطبيق</TableHead>}
              {full && <TableHead>الصور</TableHead>}
              <TableHead>تاريخ الإضافة</TableHead>
              <TableHead>{full ? "التصديق" : "حالة التصديق"}</TableHead>
              <TableHead>{full ? "مراجعة المبرمجين" : "حالة المبرمجين"}</TableHead>
              <TableHead className="text-end">
                <span className="sr-only sm:not-sr-only">الإجراءات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="stagger [--stagger-step:30ms]">
            {visible.map((t) => (
              <TableRow key={t.id} className="cursor-pointer" onClick={() => open(t)}>
                <TableCell className="tabular text-[13px] font-semibold text-muted-foreground">{formatId(t.id)}</TableCell>
                <TableCell className="whitespace-normal">
                  <Link
                    to={`/notes/${encodeURIComponent(t.id)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="line-clamp-2 leading-6 font-semibold text-foreground hover:text-brand focus-visible:text-brand"
                  >
                    {t.name}
                  </Link>
                </TableCell>
                {withDescription && (
                  <TableCell className="whitespace-normal">
                    <p className="line-clamp-2 text-[13px] leading-6 text-muted-foreground">{t.description || "—"}</p>
                  </TableCell>
                )}
                {full && (
                  <TableCell className="whitespace-normal">
                    {t.appName ? (
                      <span className="inline-flex max-w-full items-center rounded-md bg-surface-tint px-2 py-1 text-[12px] font-semibold text-brand ring-1 ring-brand/15">
                        <span className="truncate">{t.appName}</span>
                      </span>
                    ) : (
                      <span className="text-[12px] text-faint">—</span>
                    )}
                  </TableCell>
                )}
                {full && (
                  <TableCell>
                    <ImagesCell ticket={t} onOpen={(index) => setPreview({ ticket: t, index })} />
                  </TableCell>
                )}
                <TableCell className="tabular text-[13px] text-foreground">{formatShortDate(t.createdAt)}</TableCell>
                <TableCell>
                  <StatusBadge kind="approval" value={t.approval} />
                </TableCell>
                <TableCell>
                  <StatusBadge kind="dev" value={t.devStatus} />
                </TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <NoteActionsMenu ticket={t} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Phone: two-line rows */}
      <ul className="stagger divide-y divide-line-soft [--stagger-step:35ms] lg:hidden">
        {visible.map((t) => (
          <li key={t.id} className="flex items-start gap-3 px-4 py-4 sm:px-5">
            <Link to={`/notes/${encodeURIComponent(t.id)}`} className="grid min-w-0 flex-1 gap-2">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="tabular font-semibold">{formatId(t.id)}</span>
                <span aria-hidden>·</span>
                <span className="tabular">{formatShortDate(t.createdAt)}</span>
                {t.images.length > 0 && (
                  <span className="flex items-center gap-1">
                    <span aria-hidden>·</span>
                    <ImageIcon className="size-3.5" aria-hidden />
                    <span className="tabular">{formatNumber(t.images.length)}</span>
                    <span className="sr-only">صور</span>
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-[14px] leading-6 font-semibold text-foreground">{t.name}</span>
              {t.appName && (
                <span className="inline-flex w-fit max-w-full items-center rounded-md bg-surface-tint px-2 py-0.5 text-[11px] font-semibold text-brand ring-1 ring-brand/15">
                  <span className="truncate">{t.appName}</span>
                </span>
              )}
              <span className="flex flex-wrap gap-1.5">
                <StatusBadge kind="approval" value={t.approval} />
                <StatusBadge kind="dev" value={t.devStatus} />
              </span>
            </Link>
            <NoteActionsMenu ticket={t} />
          </li>
        ))}
      </ul>

      {pageSize && (
        <TablePagination
          page={activePage}
          pageSize={pageSize}
          total={serverPaged ? total : tickets.length}
          onPageChange={changePage}
        />
      )}

      <ImageLightbox
        images={preview?.ticket.images ?? []}
        index={preview?.index ?? null}
        title={preview?.ticket.name}
        onClose={() => setPreview(null)}
      />
    </>
  )
}

function ImagesCell({ ticket, onOpen }: { ticket: Ticket; onOpen: (index: number) => void }) {
  if (ticket.images.length === 0) return <span className="text-faint">—</span>
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen(0)
      }}
      className="group/img flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring"
      aria-label={`معاينة ${formatNumber(ticket.images.length)} صورة`}
    >
      <span className="relative size-9 overflow-hidden rounded-md ring-1 ring-line">
        <AuthenticatedImage
          src={ticket.images[0]}
          alt=""
          className={cn("size-full object-cover transition-transform group-hover/img:scale-105")}
          loading="lazy"
        />
      </span>
      {ticket.images.length > 1 && (
        <span className="tabular text-xs font-semibold text-muted-foreground">+{formatNumber(ticket.images.length - 1)}</span>
      )}
    </button>
  )
}
