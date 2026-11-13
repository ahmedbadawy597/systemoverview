import type { TicketFilters } from "@/domain/stats"
import { env } from "@/config/env"
import { ApiError } from "./http"
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./session"

export interface NotesPdfResult {
  fileName: string
  blob: Blob
  generatedAt: string
}

export interface NotesPreviewResult {
  html: string
  count: number
  generatedAt: string
}

function bodyFromFilters(filters: TicketFilters, includeImages: boolean) {
  const body: Record<string, unknown> = {
    approval: filters.approval || "all",
    devStatus: filters.devStatus || "all",
    includeImages,
  }
  if (filters.from) body.from = filters.from
  if (filters.to) body.to = filters.to
  if (filters.appId && filters.appId !== "all") body.appId = filters.appId
  return body
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  try {
    const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    const payload = (await response.json().catch(() => null)) as {
      success?: boolean
      data?: { accessToken?: string; refreshToken?: string; token?: string }
    } | null
    if (!response.ok || !payload || payload.success === false) {
      clearTokens()
      return false
    }
    const access = payload.data?.accessToken ?? payload.data?.token
    const nextRefresh = payload.data?.refreshToken ?? refreshToken
    if (!access) {
      clearTokens()
      return false
    }
    setTokens(access, nextRefresh)
    return true
  } catch {
    clearTokens()
    return false
  }
}

async function authorizedFetch(path: string, init: RequestInit, retried = false): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set("Accept", headers.get("Accept") || "application/json")
  const token = getAccessToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      ...init,
      headers,
    })
  } catch {
    throw new ApiError("تعذّر الاتصال بالخادم. تحقق من تشغيل الـ API.", 0, "NETWORK")
  }

  if (response.status === 401 && !retried) {
    const ok = await refreshAccessToken()
    if (ok) return authorizedFetch(path, init, true)
    clearTokens()
    throw new ApiError("انتهت الجلسة. سجّل الدخول مجددًا.", 401, "UNAUTHORIZED")
  }

  return response
}

async function readApiError(response: Response): Promise<ApiError> {
  const text = await response.text()
  try {
    const payload = JSON.parse(text) as {
      error?: { code?: string; message?: string } | string
      message?: string
    }
    const err = payload.error
    const message =
      typeof err === "string"
        ? err
        : err?.message || payload.message || `خطأ من الخادم (${response.status})`
    const code = typeof err === "object" && err?.code ? err.code : "ERROR"
    return new ApiError(message, response.status, code)
  } catch {
    return new ApiError(`استجاب الخادم بالرمز ${response.status}.`, response.status)
  }
}

function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1])
    } catch {
      return utf[1]
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1]?.trim() || fallback
}

export const reportsApi = {
  async generateNotesPdf(filters: TicketFilters, includeImages = false): Promise<NotesPdfResult> {
    const response = await authorizedFetch("/reports/notes/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/pdf, application/json",
      },
      body: JSON.stringify(bodyFromFilters(filters, includeImages)),
    })

    if (!response.ok) throw await readApiError(response)

    const contentType = response.headers.get("Content-Type") || ""
    if (!contentType.includes("application/pdf")) {
      // Unexpected JSON envelope — surface as API error.
      throw await readApiError(response)
    }

    const blob = await response.blob()
    const fileName = filenameFromDisposition(
      response.headers.get("Content-Disposition"),
      `notes-report-${new Date().toISOString().slice(0, 10)}.pdf`,
    )
    return {
      fileName,
      blob,
      generatedAt: new Date().toISOString(),
    }
  },

  async previewNotesHtml(filters: TicketFilters, includeImages = false): Promise<NotesPreviewResult> {
    const response = await authorizedFetch("/reports/notes/preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(bodyFromFilters(filters, includeImages)),
    })
    if (!response.ok) throw await readApiError(response)
    const payload = (await response.json()) as {
      success?: boolean
      data?: NotesPreviewResult
    }
    if (!payload?.data) {
      throw new ApiError("استجابة معاينة التقرير غير صالحة.", response.status, "PARSE")
    }
    return payload.data
  },
}
