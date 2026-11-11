import type { TicketStats } from "@/domain/stats"
import type { ApprovalStatus, DevReviewInput, DevStatus, NewTicketInput, Ticket } from "@/domain/ticket"
import { normalizeTicket } from "./normalize"
import { apiRequest } from "./http"

export type TicketDevFilter = DevStatus | "all" | "open"
export type TicketSort = "createdAt" | "approvedAt" | "devUpdatedAt"
export type TicketOrder = "asc" | "desc"

export interface TicketListQuery {
  page?: number
  limit?: number
  q?: string
  approval?: ApprovalStatus | "all"
  devStatus?: TicketDevFilter
  /** UUID, "none" (unlinked), or omit / "all". */
  appId?: string
  from?: string
  to?: string
  sort?: TicketSort
  order?: TicketOrder
}

export interface TicketPage {
  items: Ticket[]
  page: number
  limit: number
  total: number
  totalPages: number
}

function toQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ""
}

function mapTicket(raw: unknown): Ticket {
  const ticket = normalizeTicket(raw, 0)
  if (!ticket) throw new Error("تعذّر قراءة بيانات الملاحظة من الخادم.")
  return ticket
}

function mapPage(data: {
  items?: unknown[]
  page?: number
  limit?: number
  total?: number
  totalPages?: number
}): TicketPage {
  const items = (data.items ?? []).map((row, index) => normalizeTicket(row, index)).filter((t): t is Ticket => t !== null)
  const page = data.page ?? 1
  const limit = data.limit ?? 20
  const total = data.total ?? items.length
  const totalPages = data.totalPages ?? Math.max(1, Math.ceil(total / limit) || 1)
  return { items, page, limit, total, totalPages }
}

export const ticketsApi = {
  async listTickets(query: TicketListQuery = {}): Promise<TicketPage> {
    const data = await apiRequest<{
      items?: unknown[]
      page?: number
      limit?: number
      total?: number
      totalPages?: number
    }>(
      `/tickets${toQuery({
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        q: query.q?.trim() || undefined,
        approval: query.approval && query.approval !== "all" ? query.approval : undefined,
        devStatus: query.devStatus && query.devStatus !== "all" ? query.devStatus : undefined,
        appId: query.appId && query.appId !== "all" ? query.appId : undefined,
        from: query.from || undefined,
        to: query.to || undefined,
        sort: query.sort,
        order: query.order,
      })}`,
    )
    return mapPage(data ?? {})
  },

  /** @deprecated Prefer listTickets — kept for settings connectivity test. */
  async fetchTickets(): Promise<Ticket[]> {
    const page = await this.listTickets({ page: 1, limit: 100 })
    return page.items
  },

  async fetchStats(query: Omit<TicketListQuery, "page" | "limit" | "sort" | "order"> = {}): Promise<TicketStats> {
    const data = await apiRequest<TicketStats>(
      `/tickets/stats${toQuery({
        q: query.q?.trim() || undefined,
        approval: query.approval && query.approval !== "all" ? query.approval : undefined,
        devStatus: query.devStatus && query.devStatus !== "all" ? query.devStatus : undefined,
        appId: query.appId && query.appId !== "all" ? query.appId : undefined,
        from: query.from || undefined,
        to: query.to || undefined,
      })}`,
    )
    return {
      total: data?.total ?? 0,
      pending: data?.pending ?? 0,
      approved: data?.approved ?? 0,
      notReviewed: data?.notReviewed ?? 0,
      underStudy: data?.underStudy ?? 0,
      resolved: data?.resolved ?? 0,
    }
  },

  async getTicket(id: string): Promise<Ticket> {
    const data = await apiRequest<unknown>(`/tickets/${encodeURIComponent(id)}`)
    return mapTicket(data)
  },

  async addTicket(input: NewTicketInput): Promise<Ticket | null> {
    const data = await apiRequest<unknown>("/tickets", {
      method: "POST",
      body: {
        name: input.name.trim(),
        description: input.description.trim(),
        appId: input.appId || undefined,
        images: input.images,
      },
    })
    return data ? mapTicket(data) : null
  },

  async approveTicket(id: string): Promise<void> {
    await apiRequest(`/tickets/${encodeURIComponent(id)}/approve`, { method: "POST", body: {} })
  },

  async updateDevReview({ id, devStatus, devNotes }: DevReviewInput): Promise<void> {
    await apiRequest(`/tickets/${encodeURIComponent(id)}/dev-review`, {
      method: "PATCH",
      body: { devStatus, devNotes: devNotes.trim() },
    })
  },

  async deleteTicket(id: string): Promise<void> {
    await apiRequest(`/tickets/${encodeURIComponent(id)}`, { method: "DELETE" })
  },
}
