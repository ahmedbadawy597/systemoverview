import type { AppNotification, NotificationPage } from "@/domain/notification"
import { apiRequest } from "./http"

function mapNotification(raw: Partial<AppNotification>): AppNotification {
  return {
    id: String(raw.id ?? ""),
    type: (raw.type as AppNotification["type"]) ?? "unknown",
    title: String(raw.title ?? "إشعار"),
    body: String(raw.body ?? ""),
    entityType: raw.entityType ?? null,
    entityId: raw.entityId ?? null,
    meta: raw.meta ?? null,
    readAt: raw.readAt ?? null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  }
}

export const notificationsApi = {
  async list(params: { page?: number; limit?: number; unreadOnly?: boolean } = {}): Promise<NotificationPage> {
    const search = new URLSearchParams()
    search.set("page", String(params.page ?? 1))
    search.set("limit", String(params.limit ?? 20))
    if (params.unreadOnly) search.set("unreadOnly", "true")

    // Interceptor returns { success, data: items[], meta? } — apiRequest yields `data` (the array).
    const items = await apiRequest<Partial<AppNotification>[]>(`/notifications?${search}`)
    const list = Array.isArray(items) ? items.map(mapNotification) : []
    return {
      items: list,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      total: list.length,
      totalPages: 1,
    }
  },

  async unreadCount(): Promise<number> {
    const data = await apiRequest<{ count?: number }>("/notifications/unread-count")
    return data?.count ?? 0
  },

  async markRead(ids: string[]): Promise<number> {
    if (!ids.length) return 0
    const data = await apiRequest<{ updated?: number }>("/notifications/read", {
      method: "POST",
      body: { ids },
    })
    return data?.updated ?? 0
  },

  async markAllRead(): Promise<number> {
    const data = await apiRequest<{ updated?: number }>("/notifications/read-all", {
      method: "POST",
      body: {},
    })
    return data?.updated ?? 0
  },
}
