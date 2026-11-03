const ACCESS_KEY = "notes-system.accessToken"
const REFRESH_KEY = "notes-system.refreshToken"

export function getAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_KEY) ?? localStorage.getItem(ACCESS_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function setTokens(accessToken: string, refreshToken: string) {
  try {
    sessionStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
  } catch {
    // ignore storage failures
  }
}

export function clearTokens() {
  try {
    sessionStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch {
    // ignore
  }
}
