import { env } from "@/config/env"
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./session"

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status = 0, code = "ERROR") {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

type Envelope<T> = {
  success?: boolean
  ok?: boolean
  data?: T
  error?: { code?: string; message?: string } | string
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
    if (ok) return apiRequest<T>(path, { ...options, skipRefresh: true })
    clearTokens()
    throw new ApiError("انتهت الجلسة. سجّل الدخول مجددًا.", 401, "UNAUTHORIZED")
  }

  if (response.status === 204) return undefined as T

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
      throw new ApiError(message, response.status, code)
    }
    if (!response.ok) {
      const err = envelope.error
      throw new ApiError(
        typeof err === "string" ? err : err?.message || `خطأ من الخادم (${response.status})`,
        response.status,
        typeof err === "object" && err?.code ? err.code : "ERROR",
      )
    }
    return envelope.data as T
  }

  if (!response.ok) {
    throw new ApiError(`استجاب الخادم بالرمز ${response.status}.`, response.status)
  }

  return payload as T
}
