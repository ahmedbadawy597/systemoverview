import { ApiError } from "@/services/api/http"

/** Transient server pressure — safe to retry with backoff. */
export function isTransientApiError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.status === 503 ||
      error.status === 429 ||
      error.code === "SERVICE_UNAVAILABLE")
  )
}

/** Report filter returned too many rows for PDF. */
export function isReportTooLargeError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.status === 413 || error.code === "FILE_TOO_LARGE")
  )
}

/** Rare ticket-id race — one create retry is safe. */
export function isTicketConflictError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.status === 409 || error.code === "CONFLICT")
  )
}

export function parseRetryAfterSeconds(
  header: string | null,
  fallbackSeconds: number,
): number {
  if (!header?.trim()) return fallbackSeconds
  const asInt = Number.parseInt(header.trim(), 10)
  if (Number.isFinite(asInt) && asInt >= 0) {
    return Math.min(Math.max(asInt, 1), 60)
  }
  const asDate = Date.parse(header)
  if (Number.isFinite(asDate)) {
    const seconds = Math.ceil((asDate - Date.now()) / 1000)
    if (seconds > 0) return Math.min(seconds, 60)
  }
  return fallbackSeconds
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"))
      return
    }

    let onAbort: (() => void) | undefined
    const timer = window.setTimeout(() => {
      if (signal && onAbort) signal.removeEventListener("abort", onAbort)
      resolve()
    }, ms)

    if (!signal) return

    onAbort = () => {
      window.clearTimeout(timer)
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"))
    }
    signal.addEventListener("abort", onAbort, { once: true })
  })
}

/**
 * Retry transient 503/429 responses.
 * Uses Retry-After when present; otherwise exponential backoff from `baseDelayMs`.
 */
export async function withTransientRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: {
    maxAttempts?: number
    baseDelayMs?: number
    signal?: AbortSignal
  } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3
  const baseDelayMs = options.baseDelayMs ?? 5000
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      if (!isTransientApiError(error) || attempt >= maxAttempts) {
        throw error
      }
      const waitMs =
        (error.retryAfterSeconds && error.retryAfterSeconds > 0
          ? error.retryAfterSeconds * 1000
          : baseDelayMs * attempt) + Math.floor(Math.random() * 400)
      await sleep(waitMs, options.signal)
    }
  }

  throw lastError
}

/** User-facing title for PDF / report failures. */
export function reportErrorTitle(error: unknown): string {
  if (isReportTooLargeError(error)) {
    return "نطاق التقرير كبير جدًا"
  }
  if (isTransientApiError(error)) {
    return error.status === 429
      ? "تم تجاوز حد الطلبات مؤقتًا"
      : "الخادم مشغول بإصدار التقارير"
  }
  return "تعذّر إصدار التقرير"
}

/** Toast / dialog description; includes support reference when available. */
export function reportErrorDescription(error: unknown): string {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "حدث خطأ غير متوقع أثناء إعداد التقرير."
  if (isReportTooLargeError(error)) {
    return `${message} يُرجى تضييق الفترة الزمنية أو إلغاء إرفاق الصور ثم المحاولة مجددًا.`
  }
  if (isTransientApiError(error)) {
    const wait =
      error.retryAfterSeconds && error.retryAfterSeconds > 0
        ? error.retryAfterSeconds
        : 5
    return `${message} أعد المحاولة بعد حوالي ${wait} ثوانٍ.`
  }
  if (error instanceof ApiError && error.correlationId) {
    return `${message}\nمرجع الدعم: ${error.correlationId}`
  }
  return message
}

export function ticketCreateErrorDescription(error: unknown): string {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "حدث خطأ غير متوقع."
  if (isTransientApiError(error)) {
    const wait =
      error.retryAfterSeconds && error.retryAfterSeconds > 0
        ? error.retryAfterSeconds
        : 10
    return `${message} أعد المحاولة بعد حوالي ${wait} ثوانٍ.`
  }
  if (error instanceof ApiError && error.correlationId) {
    return `${message}\nمرجع الدعم: ${error.correlationId}`
  }
  return message
}
