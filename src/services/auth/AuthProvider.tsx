import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"
import type { PublicUser } from "@/domain/user"
import { fetchMe, loginRequest, logoutRequest } from "@/services/api/authApi"
import { ApiError } from "@/services/api/http"
import { clearTokens, getAccessToken } from "@/services/api/session"
import { PERMISSION_LABELS, type Permission } from "./roles"

interface AuthContextValue {
  user: PublicUser | null
  loading: boolean
  /** Highest system role — kept for compact UI badges. */
  role: PublicUser["primaryRole"] | null
  login: (username: string, password: string) => Promise<{ ok: true } | { ok: false; reason: "invalid" | "inactive" }>
  signOut: () => void
  can: (permission: Permission) => boolean
  /** Browse apps dashboard (published cards) — any logged-in role with view. */
  canViewApps: boolean
  /** Create/edit/credentials: assistant job title or system admin. */
  canManageApps: boolean
  /** Publish/unpublish to minister dashboard — assistant job title only. */
  canPublishApps: boolean
  /** Resolves true if the logged-in account already has the permission; otherwise shows a toast. */
  ensure: (permission: Permission) => Promise<boolean>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      return
    }
    try {
      const next = await fetchMe()
      if (!next.isActive) {
        clearTokens()
        setUser(null)
        return
      }
      setUser(next)
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.code === "UNAUTHORIZED")) {
        clearTokens()
        setUser(null)
        return
      }
      throw error
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        await refreshUser()
      } catch {
        clearTokens()
        setUser(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [refreshUser])

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginRequest(username, password)
    if (!result.ok) return result
    setUser(result.user)
    return { ok: true as const }
  }, [])

  const signOut = useCallback(() => {
    void logoutRequest()
    setUser(null)
  }, [])

  const canViewApps = Boolean(user?.permissions.includes("view"))
  const canManageApps = Boolean(
    user && (user.jobTitle === "assistant" || user.roles.includes("admin")),
  )
  const canPublishApps = user?.jobTitle === "assistant"

  const can = useCallback(
    (permission: Permission) => {
      if (!user) return false
      if (permission === "manageApps") return canManageApps
      return user.permissions.includes(permission)
    },
    [user, canManageApps],
  )

  const ensure = useCallback(
    async (permission: Permission) => {
      if (can(permission)) return true
      toast.error("لا تملك صلاحية هذا الإجراء", {
        description: `يتطلب صلاحية «${PERMISSION_LABELS[permission]}». اطلب من المدير تعيين الدور المناسب لحسابك.`,
      })
      return false
    },
    [can],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      role: user?.primaryRole ?? null,
      login,
      signOut,
      can,
      canViewApps,
      canManageApps,
      canPublishApps,
      ensure,
      refreshUser,
    }),
    [user, loading, login, signOut, can, canViewApps, canManageApps, canPublishApps, ensure, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
