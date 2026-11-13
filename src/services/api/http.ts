import { env } from "@/config/env"
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./session"

export type DuplicateAppRef = {
  id: string
  name: string
  url: string
  matchedBy: "name" | "url"
}

export type ApiValidationDetail = {
  field?: string
  message: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly existing?: DuplicateAppRef
  readonly details?: ApiValidationDetail[]

  constructor(
    message: string,
    status = 0,
    code = "ERROR",
    existing?: DuplicateAppRef,
    details?: ApiValidationDetail[],
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.existing = existing
    this.details = details
  }
}

type Envelope<T> = {
  success?: boolean
  ok?: boolean
  data?: T
  meta?: PageMeta
  error?: {
    code?: string
    message?: string
    existing?: DuplicateAppRef
    details?: ApiValidationDetail[]
  } | string
}

export interface PageMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  try {
    const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    const payload = (await response.json().catch(() => null)) as Envelope<{
      accessToken?: string
      refreshToken?: string
      token?: string
    }> | null
    if (!response.ok || !payload || payload.success === false || payload.ok === false) {
      clearTokens()
      return false
    }
    const data =
      payload.data ??
      (payload as unknown as { accessToken?: string; refreshToken?: string; token?: string })
    const access = data.accessToken ?? data.token
    const nextRefresh = data.refreshToken ?? refreshToken
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

function ensureRefresh() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

export interface RequestOptions {
  method?: string
  body?: unknown
  auth?: boolean
  /** Skip one refresh retry (used by refresh itself). */
  skipRefresh?: boolean
  signal?: AbortSignal
}

async function executeRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: PageMeta }> {
  const method = options.method ?? (options.body !== undefined ? "POST" : "GET")
  const headers: Record<string, string> = { Accept: "application/json" }
  if (options.body !== undefined) headers["Content-Type"] = "application/json"
  if (options.auth !== false) {
    const token = getAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch {
    throw new ApiError("تعذّر الاتصال بالخادم. تحقق من تشغيل الـ API.", 0, "NETWORK")
  }

  if (response.status === 401 && options.auth !== false && !options.skipRefresh) {
    const ok = await ensureRefresh()
    if (ok) return executeRequest<T>(path, { ...options, skipRefresh: true })
    clearTokens()
    throw new ApiError("انتهت الجلسة. سجّل الدخول مجددًا.", 401, "UNAUTHORIZED")
  }

  if (response.status === 204) return { data: undefined as T }

  const text = await response.text()
  let payload: Envelope<T> | T | null = null
  if (text) {
    try {
      payload = JSON.parse(text) as Envelope<T>
    } catch {
      throw new ApiError("استجابة غير صالحة من الخادم.", response.status, "PARSE")
    }
  }

  if (payload && typeof payload === "object" && ("success" in payload || "ok" in payload || "error" in payload)) {
    const envelope = payload as Envelope<T>
    const success = envelope.success ?? envelope.ok
    if (success === false || (response.ok === false && envelope.error)) {
      const err = envelope.error
      const message = typeof err === "string" ? err : err?.message || "رفض الخادم الطلب."
      const code = typeof err === "object" && err?.code ? err.code : "ERROR"
      const existing = typeof err === "object" ? err?.existing : undefined
      const details = typeof err === "object" ? err?.details : undefined
      throw new ApiError(message, response.status, code, existing, details)
    }
    if (!response.ok) {
      const err = envelope.error
      throw new ApiError(
        typeof err === "string" ? err : err?.message || `خطأ من الخادم (${response.status})`,
        response.status,
        typeof err === "object" && err?.code ? err.code : "ERROR",
        typeof err === "object" ? err?.existing : undefined,
        typeof err === "object" ? err?.details : undefined,
      )
    }
    return { data: envelope.data as T, meta: envelope.meta }
  }

  if (!response.ok) {
    throw new ApiError(`استجاب الخادم بالرمز ${response.status}.`, response.status)
  }

  return { data: payload as T }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await executeRequest<T>(path, options)
  return data
}

/** Same as apiRequest, but keeps pagination `meta` when the API returns it. */
export async function apiRequestWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: PageMeta }> {
  return executeRequest<T>(path, options)
}
