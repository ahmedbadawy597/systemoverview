import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationsApi } from "@/services/api/notificationsApi"
import { getAccessToken } from "@/services/api/session"

export const NOTIFICATIONS_KEY = ["notifications"] as const
export const NOTIFICATIONS_UNREAD_KEY = ["notifications", "unread-count"] as const

export function useUnreadNotificationsCount(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_KEY,
    queryFn: () => notificationsApi.unreadCount(),
    enabled: enabled && Boolean(getAccessToken()),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })
}

export function useNotificationsList(enabled = true, limit = 20) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "list", { limit }] as const,
    queryFn: () => notificationsApi.list({ page: 1, limit }),
    enabled: enabled && Boolean(getAccessToken()),
    staleTime: 10_000,
  })
}

function invalidateNotifications(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
  void client.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY })
}

export function useMarkNotificationsRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => notificationsApi.markRead(ids),
    onSuccess: () => invalidateNotifications(client),
  })
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => invalidateNotifications(client),
  })
}
