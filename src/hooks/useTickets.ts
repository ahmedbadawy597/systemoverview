import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { TicketFilters } from "@/domain/stats"
import type { DevReviewInput, NewTicketInput, Ticket } from "@/domain/ticket"
import { ticketsApi, type TicketListQuery } from "@/services/api/ticketsApi"

export const TICKETS_KEY = ["tickets"] as const
export const TICKET_STATS_KEY = ["tickets", "stats"] as const

export function ticketsQueryKey(query: TicketListQuery) {
  return [...TICKETS_KEY, "list", query] as const
}

export function useTicketList(query: TicketListQuery, enabled = true) {
  return useQuery({
    queryKey: ticketsQueryKey(query),
    queryFn: () => ticketsApi.listTickets(query),
    staleTime: 15_000,
    enabled,
  })
}

export function useTicketStats(filters: Partial<TicketFilters> = {}, enabled = true) {
  const query = {
    q: filters.query?.trim() || undefined,
    approval: filters.approval,
    devStatus: filters.devStatus,
    from: filters.from,
    to: filters.to,
  }
  return useQuery({
    queryKey: [...TICKET_STATS_KEY, query] as const,
    queryFn: () => ticketsApi.fetchStats(query),
    staleTime: 15_000,
    enabled: enabled !== false,
  })
}

/** Recent tickets helper for dashboard / search / notifications. */
export function useTickets(limit = 50) {
  const query = useTicketList({ page: 1, limit, sort: "createdAt", order: "desc" })
  return {
    ...query,
    data: query.data?.items,
  }
}

export function useTicket(id: string | undefined) {
  const query = useQuery({
    queryKey: [...TICKETS_KEY, "one", id] as const,
    queryFn: () => ticketsApi.getTicket(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  })
  return { ...query, ticket: query.data }
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "حدث خطأ غير متوقع."
}

function invalidateTicketQueries(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: TICKETS_KEY })
  void client.invalidateQueries({ queryKey: TICKET_STATS_KEY })
}

export function useAddTicket() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NewTicketInput) => ticketsApi.addTicket(input),
    onSuccess: () => invalidateTicketQueries(client),
    onError: (error) => toast.error("تعذّر حفظ الملاحظة", { description: errorMessage(error) }),
  })
}

export function useApproveTicket() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ticketsApi.approveTicket(id),
    onSuccess: () => {
      toast.success("تم تصديق الملاحظة")
      invalidateTicketQueries(client)
    },
    onError: (error) => toast.error("تعذّر تصديق الملاحظة", { description: errorMessage(error) }),
  })
}

export function useUpdateDevReview() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: DevReviewInput) => ticketsApi.updateDevReview(input),
    onSuccess: () => {
      toast.success("تم حفظ مراجعة المبرمجين")
      invalidateTicketQueries(client)
    },
    onError: (error) => toast.error("تعذّر حفظ المراجعة", { description: errorMessage(error) }),
  })
}

export function useDeleteTicket() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ticketsApi.deleteTicket(id),
    onSuccess: () => {
      toast.success("تم حذف الملاحظة")
      invalidateTicketQueries(client)
    },
    onError: (error) => toast.error("تعذّر حذف الملاحظة", { description: errorMessage(error) }),
  })
}

export type { Ticket }
