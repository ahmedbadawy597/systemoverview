import type { ApiValidationDetail } from "@/services/api/http"

/** Map Nest/class-validator property paths onto Add App draft keys. */
export const APP_FORM_FIELD_MAP: Record<string, string> = {
  name: "name",
  description: "description",
  url: "url",
  color: "color",
  icon: "icon",
  statusLabel: "statusLabel",
  usersCount: "usersCount",
  operationalReadinessPercent: "operationalReadinessPercent",
  sortOrder: "sortOrder",
  isFeatured: "isFeatured",
  publishNow: "publishNow",
}

/** Map ticket/note DTO properties onto Add Note / developer review fields. */
export const NOTE_FORM_FIELD_MAP: Record<string, string> = {
  name: "name",
  description: "description",
  appId: "appId",
  images: "images",
  file: "images",
  devNotes: "devNotes",
  devStatus: "devStatus",
  statusAr: "devStatus",
}

type LocalizeFn = (field: string, message: string) => string

/** Prefer clear Arabic copy when the API returns English class-validator defaults. */
export function localizeAppFieldMessage(field: string, message: string): string {
  const lower = message.toLowerCase()
  if (field === "operationalReadinessPercent") {
    if (/greater than|less than|min|max|between|must be/.test(lower) || /integer|number/.test(lower)) {
      return "يرجى إدخال نسبة جاهزية صحيحة بين 0 و100"
    }
  }
  if (field === "usersCount") {
    if (/integer|number|min|max|greater|less/.test(lower)) {
      return "يرجى إدخال عدد صحيح للمستخدمين"
    }
  }
  if (field === "sortOrder") {
    if (/integer|number|min|max|greater|less/.test(lower)) {
      return "يرجى إدخال رقم صحيح لترتيب العرض"
    }
  }
  if (field === "name") {
    if (/should not be empty|must be|maxlength|length/.test(lower)) {
      return "يرجى إدخال اسم التطبيق بشكل صحيح"
    }
  }
  if (field === "url") {
    if (/url|must be/.test(lower)) {
      return "رابط التطبيق غير صالح"
    }
  }
  return message
}

export function localizeNoteFieldMessage(field: string, message: string): string {
  const haystack = `${message} ${message.toLowerCase()}`

  if (field === "name") {
    return "اسم الملاحظة غير صالح أو يتجاوز الحد المسموح"
  }
  if (field === "description") {
    return "وصف الملاحظة غير صالح أو يتجاوز الحد المسموح"
  }
  if (field === "devNotes") {
    return "ملاحظات المطور غير صالحة أو تتجاوز الحد المسموح"
  }
  if (field === "images") {
    return "صيغة الصورة غير مدعومة أو محتوى الصورة غير صالح"
  }
  if (field === "appId") {
    if (/uuid|must be|invalid/i.test(haystack)) {
      return "التطبيق المرتبط غير صالح"
    }
  }

  return message
}

/**
 * Convert API validation `details` into a form-field error map.
 * Unmapped details remain available for a form-level fallback message.
 */
export function mapApiDetailsToFormErrors(
  details: ApiValidationDetail[] | undefined,
  fieldMap: Record<string, string> = APP_FORM_FIELD_MAP,
  localize: LocalizeFn = localizeAppFieldMessage,
): { fieldErrors: Record<string, string>; unmapped: string[] } {
  const fieldErrors: Record<string, string> = {}
  const unmapped: string[] = []

  for (const detail of details ?? []) {
    const rawField = (detail.field ?? "").split(".")[0]
    const mapped = rawField ? fieldMap[rawField] : undefined
    const message = detail.message?.trim()
    if (!message) continue
    if (!mapped) {
      unmapped.push(message)
      continue
    }
    if (!fieldErrors[mapped]) {
      fieldErrors[mapped] = localize(mapped, message)
    }
  }

  return { fieldErrors, unmapped }
}

export const APP_FORM_FIELD_IDS: Record<string, string> = {
  name: "app-name",
  description: "app-description",
  url: "app-url",
  usersCount: "app-users",
  operationalReadinessPercent: "app-ready",
  sortOrder: "app-sort",
}

export const NOTE_FORM_FIELD_IDS: Record<string, string> = {
  name: "note-name",
  description: "note-description",
  appId: "note-app",
  images: "note-images-label",
  devNotes: "note-dev-notes",
}

export function focusFirstFormError(
  fieldErrors: Record<string, string>,
  fieldIds: Record<string, string> = APP_FORM_FIELD_IDS,
): void {
  const firstKey = Object.keys(fieldErrors)[0]
  if (!firstKey) return
  const id = fieldIds[firstKey]
  if (!id) return
  const el = document.getElementById(id)
  if (el instanceof HTMLElement) {
    el.focus()
    el.scrollIntoView({ behavior: "smooth", block: "center" })
  }
}
