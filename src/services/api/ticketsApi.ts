import type { DevReviewInput, NewTicketInput, Ticket } from "@/domain/ticket"
import { normalizeTicket, normalizeTicketList, toSheetDevStatus } from "./normalize"
import { callBackend } from "./transport"

export const ticketsApi = {
  async fetchTickets(): Promise<Ticket[]> {
    const raw = await callBackend("fetchTickets")
    return normalizeTicketList(raw)
  },

  /** Returns the created ticket when the backend echoes it, otherwise null (callers refetch). */
  async addTicket(input: NewTicketInput): Promise<Ticket | null> {
    const raw = await callBackend("addTicketToSheet", {
      name: input.name.trim(),
      description: input.description.trim(),
      images: input.images,
    })
    if (raw && typeof raw === "object") return normalizeTicket(raw, 0)
    return null
  },

  async approveTicket(id: string): Promise<void> {
    await callBackend("approveTicketInSheet", id)
  },

  async updateDevReview({ id, devStatus, devNotes }: DevReviewInput): Promise<void> {
    await callBackend("updateDevInSheet", id, toSheetDevStatus(devStatus), devNotes.trim())
  },

  async deleteTicket(id: string): Promise<void> {
    await callBackend("deleteTicketFromSheet", id)
  },
}
