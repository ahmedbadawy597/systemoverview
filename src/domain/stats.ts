import type { ApprovalStatus, DevStatus, Ticket } from "./ticket"
import { normalizeArabic } from "@/lib/format"

export interface TicketStats {
  total: number
  pending: number
  approved: number
  notReviewed: number
  underStudy: number
  resolved: number
}

export function computeStats(tickets: Ticket[]): TicketStats {
  const stats: TicketStats = { total: 0, pending: 0, approved: 0, notReviewed: 0, underStudy: 0, resolved: 0 }
  for (const t of tickets) {
    stats.total += 1
    if (t.approval === "approved") stats.approved += 1
    else stats.pending += 1
    if (t.devStatus === "resolved") stats.resolved += 1
    else if (t.devStatus === "under_study") stats.underStudy += 1
    else stats.notReviewed += 1
  }
  return stats
}

export interface TicketFilters {
  query: string
  approval: ApprovalStatus | "all"
  devStatus: DevStatus | "all"
  /** Linked app id, "none" for unlinked notes, or "all". */
  appId: string
  /** yyyy-mm-dd, inclusive, local time */
  from: string
  to: string
}

export const EMPTY_FILTERS: TicketFilters = {
  query: "",
  approval: "all",
  devStatus: "all",
  appId: "all",
  from: "",
  to: "",
}

export function hasActiveFilters(f: TicketFilters) {
  return Boolean(
    f.query.trim() ||
      f.approval !== "all" ||
      f.devStatus !== "all" ||
      (f.appId && f.appId !== "all") ||
      f.from ||
      f.to,
  )
}

function dayStart(value: string) {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d).getTime()
}

export function applyFilters(tickets: Ticket[], f: TicketFilters): Ticket[] {
  const q = normalizeArabic(f.query)
  const from = f.from ? dayStart(f.from) : null
  const to = f.to ? dayStart(f.to) + 86_400_000 : null
  return tickets.filter((t) => {
    if (f.approval !== "all" && t.approval !== f.approval) return false
    if (f.devStatus !== "all" && t.devStatus !== f.devStatus) return false
    if (f.appId && f.appId !== "all") {
      if (f.appId === "none") {
        if (t.appId) return false
      } else if (t.appId !== f.appId) {
        return false
      }
    }
    const created = new Date(t.createdAt).getTime()
    if (from !== null && created < from) return false
    if (to !== null && created >= to) return false
    if (q) {
      const haystack = normalizeArabic(
        `${t.id} ${t.name} ${t.description} ${t.devNotes} ${t.appName ?? ""}`,
      )
      if (!haystack.includes(q)) return false
    }
    return true
  })
}
