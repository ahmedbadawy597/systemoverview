export type ApprovalStatus = "pending" | "approved"
export type DevStatus = "not_reviewed" | "under_study" | "resolved"

export interface Ticket {
  id: string
  name: string
  description: string
  /** Linked workspace app when the note is about a specific system. */
  appId: string | null
  /** Resolved app display name (from catalog). */
  appName: string | null
  /** Image URLs or data URLs, as stored by the backend. */
  images: string[]
  /** ISO 8601 timestamp. */
  createdAt: string
  approval: ApprovalStatus
  approvedAt: string | null
  devStatus: DevStatus
  devNotes: string
  devUpdatedAt: string | null
}

export interface NewTicketInput {
  name: string
  description: string
  appId?: string | null
  /** JPEG data URLs compressed in the browser. */
  images: string[]
}

export interface DevReviewInput {
  id: string
  devStatus: DevStatus
  devNotes: string
}

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  pending: "بانتظار التصديق",
  approved: "تم التصديق",
}

export const DEV_LABELS: Record<DevStatus, string> = {
  not_reviewed: "لم تتم المراجعة",
  under_study: "قيد الدراسة",
  resolved: "تم تلافي الملاحظة",
}

export const APPROVAL_ORDER: ApprovalStatus[] = ["pending", "approved"]
export const DEV_ORDER: DevStatus[] = ["not_reviewed", "under_study", "resolved"]
