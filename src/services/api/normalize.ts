import {
  APPROVAL_LABELS,
  DEV_LABELS,
  type ApprovalStatus,
  type DevStatus,
  type Ticket,
} from "@/domain/ticket"

/**
 * Mapping between sheet rows and the frontend Ticket. This is the one place to adjust when the
 * sheet's column order or field names are confirmed.
 */
const ROW_COLUMNS = [
  "id",
  "name",
  "description",
  "appId",
  "images",
  "createdAt",
  "approval",
  "devStatus",
  "devNotes",
  "approvedAt",
  "devUpdatedAt",
] as const

const FIELD_ALIASES: Record<(typeof ROW_COLUMNS)[number], string[]> = {
  id: ["id", "ID", "Id", "ticketId", "رقم", "رقم الملاحظة"],
  name: ["name", "title", "اسم", "اسم الملاحظة", "العنوان"],
  description: ["description", "desc", "details", "وصف", "الوصف", "وصف الملاحظة"],
  appId: ["appId", "app_id", "applicationId", "التطبيق"],
  images: ["images", "image", "imgs", "photos", "الصور", "صور"],
  createdAt: ["createdAt", "date", "timestamp", "created", "التاريخ", "تاريخ الإضافة"],
  approval: ["approval", "approved", "approvalStatus", "status", "التصديق", "حالة التصديق"],
  devStatus: ["devStatus", "dev", "developerStatus", "حالة المبرمجين", "مراجعة المبرمجين"],
  devNotes: ["devNotes", "devNote", "notes", "developerNotes", "ملاحظات المبرمجين"],
  approvedAt: ["approvedAt", "approvalDate", "تاريخ التصديق"],
  devUpdatedAt: ["devUpdatedAt", "devDate", "lastUpdate", "تاريخ المراجعة"],
}

function pick(source: Record<string, unknown>, key: (typeof ROW_COLUMNS)[number]): unknown {
  for (const alias of FIELD_ALIASES[key]) {
    if (alias in source && source[alias] !== undefined) return source[alias]
  }
  return undefined
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function toIso(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null
  const date = value instanceof Date ? value : new Date(value as string | number)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean)
  const text = toText(value)
  if (!text) return []
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) return parsed.map(toText).filter(Boolean)
    } catch {
      // fall through to delimiter split
    }
  }
  if (text.startsWith("data:")) return [text]
  return text
    .split(/[\n,|]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function parseApproval(value: unknown): ApprovalStatus {
  if (value === true) return "approved"
  const text = toText(value).toLowerCase()
  if (!text) return "pending"
  if (text === "approved" || text === "true" || text === "yes" || text === APPROVAL_LABELS.approved)
    return "approved"
  if (text.includes("تم التصديق") || text === "مصدق" || text === "مصدقة") return "approved"
  return "pending"
}

export function parseDevStatus(value: unknown): DevStatus {
  const text = toText(value).toLowerCase()
  if (!text) return "not_reviewed"
  if (text === "resolved" || text === "fixed" || text.includes("تلافي") || text.includes("تم الحل"))
    return "resolved"
  if (text === "under_study" || text === "in_progress" || text.includes("دراسة")) return "under_study"
  return "not_reviewed"
}

/** Values written back to the sheet use the same Arabic labels the users read. */
export const toSheetDevStatus = (status: DevStatus) => DEV_LABELS[status]

export function normalizeTicket(raw: unknown, index: number): Ticket | null {
  let source: Record<string, unknown>
  if (Array.isArray(raw)) {
    source = Object.fromEntries(ROW_COLUMNS.map((key, i) => [key, raw[i]]))
  } else if (raw && typeof raw === "object") {
    source = raw as Record<string, unknown>
  } else {
    return null
  }

  const id = toText(pick(source, "id")) || String(index + 1)
  const name = toText(pick(source, "name"))
  const description = toText(pick(source, "description"))
  if (!name && !description) return null

  const appIdRaw = toText(pick(source, "appId"))
  const appNameRaw = toText(source.appName ?? source.app_name ?? source["اسم التطبيق"])

  return {
    id,
    name: name || "بدون اسم",
    description,
    appId: appIdRaw || null,
    appName: appNameRaw || null,
    images: toImages(pick(source, "images")),
    createdAt: toIso(pick(source, "createdAt")) ?? new Date(0).toISOString(),
    approval: parseApproval(pick(source, "approval")),
    approvedAt: toIso(pick(source, "approvedAt")),
    devStatus: parseDevStatus(pick(source, "devStatus")),
    devNotes: toText(pick(source, "devNotes")),
    devUpdatedAt: toIso(pick(source, "devUpdatedAt")),
  }
}

export function normalizeTicketList(raw: unknown): Ticket[] {
  let list: unknown = raw
  if (typeof list === "string") {
    try {
      list = JSON.parse(list)
    } catch {
      list = []
    }
  }
  if (list && typeof list === "object" && !Array.isArray(list)) {
    const wrapped = list as Record<string, unknown>
    list = wrapped.tickets ?? wrapped.data ?? wrapped.rows ?? []
  }
  if (!Array.isArray(list)) return []
  return list
    .map((item, index) => normalizeTicket(item, index))
    .filter((ticket): ticket is Ticket => ticket !== null)
}
