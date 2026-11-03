import type { TicketFilters } from "@/domain/stats"
import { apiRequest } from "./http"

export interface NotesPdfResult {
  fileName: string
  url: string
  generatedAt: string
}

export interface NotesPreviewResult {
  html: string
  count: number
  generatedAt: string
}

function bodyFromFilters(filters: TicketFilters, includeImages: boolean) {
  return {
    from: filters.from || undefined,
    to: filters.to || undefined,
    approval: filters.approval || "all",
    devStatus: filters.devStatus || "all",
    includeImages,
  }
}

export const reportsApi = {
  generateNotesPdf(filters: TicketFilters, includeImages = false) {
    return apiRequest<NotesPdfResult>("/reports/notes/pdf", {
      method: "POST",
      body: bodyFromFilters(filters, includeImages),
    })
  },

  previewNotesHtml(filters: TicketFilters, includeImages = false) {
    return apiRequest<NotesPreviewResult>("/reports/notes/preview", {
      method: "POST",
      body: bodyFromFilters(filters, includeImages),
    })
  },
}
