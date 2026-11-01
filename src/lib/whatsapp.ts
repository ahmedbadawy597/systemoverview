import { APPROVAL_LABELS, DEV_LABELS, type Ticket } from "@/domain/ticket"
import { formatId } from "./format"

export function buildWhatsAppMessage(ticket: Ticket) {
  return [
    "ملاحظة جديدة",
    "",
    `رقم الملاحظة: ${formatId(ticket.id)}`,
    `اسم الملاحظة: ${ticket.name}`,
    "",
    "الوصف:",
    ticket.description || "—",
    "",
    `حالة التصديق: ${APPROVAL_LABELS[ticket.approval]}`,
    `حالة المبرمجين: ${DEV_LABELS[ticket.devStatus]}`,
  ].join("\n")
}

export function buildWhatsAppUrl(ticket: Ticket) {
  return `https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage(ticket))}`
}

export function shareOnWhatsApp(ticket: Ticket) {
  window.open(buildWhatsAppUrl(ticket), "_blank", "noopener,noreferrer")
}
