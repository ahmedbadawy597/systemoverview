import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { RolePasswordModal } from "@/components/auth/RolePasswordModal"
import { can as roleCan, roleForPermission, ROLES, type Permission, type ProtectedRole, type Role } from "./roles"

const STORAGE_KEY = "notes-system.role"

interface AuthContextValue {
  role: Role | null
  signIn: (role: Role) => void
  signOut: () => void
  can: (permission: Permission) => boolean
  /** Resolves true once the session holds the permission, asking for the matching role password if needed. */
  ensure: (permission: Permission) => Promise<boolean>
  /** Asks for a role password and switches the session to that role. */
  elevate: (role: ProtectedRole) => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredRole(): Role | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)
    return value && value in ROLES ? (value as Role) : null
  } catch {
    return null
  }
}

type Prompt = { role: ProtectedRole; reason?: Permission }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(readStoredRole)
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const resolver = useRef<((ok: boolean) => void) | null>(null)

  const signIn = useCallback((next: Role) => {
    setRole(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode: the session simply will not survive a reload.
    }
  }, [])

  const signOut = useCallback(() => {
    setRole(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const ask = useCallback((next: Prompt) => {
    resolver.current?.(false)
    setPrompt(next)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const ensure = useCallback(
    (permission: Permission) => {
      if (roleCan(role, permission)) return Promise.resolve(true)
      return ask({ role: roleForPermission(permission), reason: permission })
    },
    [role, ask],
  )

  const elevate = useCallback((target: ProtectedRole) => ask({ role: target }), [ask])

  const finish = (ok: boolean) => {
    if (ok && prompt) signIn(prompt.role)
    resolver.current?.(ok)
    resolver.current = null
    setPrompt(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({ role, signIn, signOut, can: (p) => roleCan(role, p), ensure, elevate }),
    [role, signIn, signOut, ensure, elevate],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <RolePasswordModal
        open={prompt !== null}
        role={prompt?.role ?? "admin"}
        confirmLabel="متابعة"
        onVerified={() => finish(true)}
        onCancel={() => finish(false)}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
