import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { DevReviewInput, NewTicketInput, Ticket } from "@/domain/ticket"
import { ticketsApi } from "@/services/api/ticketsApi"

export const TICKETS_KEY = ["tickets"] as const

const byNewest = (a: Ticket, b: Ticket) =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() || Number(b.id) - Number(a.id)

export function useTickets() {
  return useQuery({
    queryKey: TICKETS_KEY,
    queryFn: async () => (await ticketsApi.fetchTickets()).sort(byNewest),
    staleTime: 30_000,
  })
}

export function useTicket(id: string | undefined) {
  const query = useTickets()
  const ticket = id ? query.data?.find((t) => t.id === id) : undefined
  return { ...query, ticket }
}

function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "حدث خطأ غير متوقع."
}

function usePatchCache() {
  const client = useQueryClient()
  return {
    client,
    patch(id: string, change: Partial<Ticket>) {
      const previous = client.getQueryData<Ticket[]>(TICKETS_KEY)
      client.setQueryData<Ticket[]>(TICKETS_KEY, (list) =>
        list?.map((t) => (t.id === id ? { ...t, ...change } : t)),
      )
      return previous
    },
    restore(previous: Ticket[] | undefined) {
      if (previous) client.setQueryData(TICKETS_KEY, previous)
    },
  }
}

export function useAddTicket() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: NewTicketInput) => ticketsApi.addTicket(input),
    onSuccess: (created) => {
      if (created) {
        client.setQueryData<Ticket[]>(TICKETS_KEY, (list) => [created, ...(list ?? []).filter((t) => t.id !== created.id)])
      }
      void client.invalidateQueries({ queryKey: TICKETS_KEY })
    },
    onError: (error) => toast.error("تعذّر حفظ الملاحظة", { description: errorMessage(error) }),
  })
}

export function useApproveTicket() {
  const cache = usePatchCache()
  return useMutation({
    mutationFn: (id: string) => ticketsApi.approveTicket(id),
    onMutate: (id) => ({ previous: cache.patch(id, { approval: "approved", approvedAt: new Date().toISOString() }) }),
    onSuccess: () => toast.success("تم تصديق الملاحظة"),
    onError: (error, _id, context) => {
      cache.restore(context?.previous)
      toast.error("تعذّر تصديق الملاحظة", { description: errorMessage(error) })
    },
    onSettled: () => cache.client.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}

export function useUpdateDevReview() {
  const cache = usePatchCache()
  return useMutation({
    mutationFn: (input: DevReviewInput) => ticketsApi.updateDevReview(input),
    onMutate: (input) => ({
      previous: cache.patch(input.id, {
        devStatus: input.devStatus,
        devNotes: input.devNotes.trim(),
        devUpdatedAt: new Date().toISOString(),
      }),
    }),
    onSuccess: () => toast.success("تم حفظ مراجعة المبرمجين"),
    onError: (error, _input, context) => {
      cache.restore(context?.previous)
      toast.error("تعذّر حفظ المراجعة", { description: errorMessage(error) })
    },
    onSettled: () => cache.client.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}

export function useDeleteTicket() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ticketsApi.deleteTicket(id),
    onMutate: (id) => {
      const previous = client.getQueryData<Ticket[]>(TICKETS_KEY)
      client.setQueryData<Ticket[]>(TICKETS_KEY, (list) => list?.filter((t) => t.id !== id))
      return { previous }
    },
    onSuccess: () => toast.success("تم حذف الملاحظة"),
    onError: (error, _id, context) => {
      if (context?.previous) client.setQueryData(TICKETS_KEY, context.previous)
      toast.error("تعذّر حذف الملاحظة", { description: errorMessage(error) })
    },
    onSettled: () => client.invalidateQueries({ queryKey: TICKETS_KEY }),
  })
}
