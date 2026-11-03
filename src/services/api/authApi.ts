import type { PublicUser } from "@/domain/user"
import { apiRequest, ApiError } from "./http"
import { mapApiUser, type ApiUserPayload } from "./mapUser"
import { clearTokens, getRefreshToken, setTokens } from "./session"

interface LoginData {
  accessToken: string
  refreshToken: string
  token?: string
  expiresIn?: number
  user: ApiUserPayload
}

export async function loginRequest(
  username: string,
  password: string,
): Promise<{ ok: true; user: PublicUser } | { ok: false; reason: "invalid" | "inactive" }> {
  try {
    const data = await apiRequest<LoginData>("/auth/login", {
      method: "POST",
      body: { username: username.trim(), password },
      auth: false,
    })
    setTokens(data.accessToken || data.token || "", data.refreshToken)
    return { ok: true, user: mapApiUser(data.user) }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === "INACTIVE_USER") return { ok: false, reason: "inactive" }
      if (error.status === 401 || error.code === "INVALID_CREDENTIALS") return { ok: false, reason: "invalid" }
    }
    throw error
  }
}

export async function fetchMe(): Promise<PublicUser> {
  const data = await apiRequest<ApiUserPayload>("/auth/me")
  return mapApiUser(data)
}

export async function logoutRequest() {
  const refreshToken = getRefreshToken()
  try {
    if (refreshToken) {
      await apiRequest<void>("/auth/logout", { method: "POST", body: { refreshToken } })
    }
  } catch {
    // ignore logout network errors — local session still clears
  } finally {
    clearTokens()
  }
}
