export type NotificationType =
  | "app.created"
  | "app.published"
  | "report.created"
  | "report.published"
  | "chat.message"
  | "ticket.created"
  | "ticket.approved"
  | "ticket.dev_updated"
  | string

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  entityType: string | null
  entityId: string | null
  meta: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

export interface NotificationPage {
  items: AppNotification[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export function notificationHref(n: AppNotification): string | null {
  if (!n.entityType || !n.entityId) return null
  if (n.entityType === "ticket") return `/notes/${encodeURIComponent(n.entityId)}`
  if (n.entityType === "report") return `/reports`
  return null
}
