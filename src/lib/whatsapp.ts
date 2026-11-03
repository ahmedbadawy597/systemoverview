import { APPROVAL_LABELS, DEV_LABELS, type Ticket } from "@/domain/ticket"
import { formatDate, formatId, formatNumber } from "./format"

const LINE = "────────────────────"

export function buildWhatsAppMessage(ticket: Ticket) {
  const imageCount = ticket.images.length
  const lines = [
    "*وزارة الأوقاف المصرية*",
    "*نظام إدارة الملاحظات*",
    LINE,
    "*ملاحظة جديدة*",
    "",
    `• *رقم الملاحظة:* ${formatId(ticket.id)}`,
    `• *اسم الملاحظة:* ${ticket.name}`,
    `• *تاريخ الإضافة:* ${formatDate(ticket.createdAt)}`,
    imageCount > 0 ? `• *المرفقات:* ${formatNumber(imageCount)} صورة` : null,
    "",
    "*الوصف*",
    ticket.description?.trim() || "—",
    "",
    "*الحالة*",
    `• *التصديق:* ${APPROVAL_LABELS[ticket.approval]}`,
    `• *مراجعة المبرمجين:* ${DEV_LABELS[ticket.devStatus]}`,
  ]

  if (ticket.devNotes?.trim()) {
    lines.push("", "*ملاحظات المبرمجين*", ticket.devNotes.trim())
  }

  lines.push(LINE, "_رسالة تلقائية من نظام إدارة الملاحظات_")

  return lines.filter((line): line is string => line !== null).join("\n")
}

export function buildWhatsAppUrl(ticket: Ticket) {
  return `https://wa.me/?text=${encodeURIComponent(buildWhatsAppMessage(ticket))}`
}

export function shareOnWhatsApp(ticket: Ticket) {
  window.open(buildWhatsAppUrl(ticket), "_blank", "noopener,noreferrer")
}
