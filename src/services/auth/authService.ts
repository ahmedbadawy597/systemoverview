import { env } from "@/config/env"
import type { ProtectedRole } from "./roles"

/**
 * Client-side role check, matching how the current system works. It is NOT secure
 * authentication: anything shipped to the browser can be read. Only SHA-256 hashes are bundled,
 * never the passwords. To move to server-side auth, replace verifyRolePassword with a backend
 * call; nothing else in the app needs to change.
 */

export type VerifyResult = { ok: true } | { ok: false; reason: "invalid" | "not_configured" | "unavailable" }

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export function isRoleConfigured(role: ProtectedRole) {
  return /^[0-9a-f]{64}$/.test(env.roleHashes[role])
}

export async function verifyRolePassword(role: ProtectedRole, password: string): Promise<VerifyResult> {
  if (!isRoleConfigured(role)) return { ok: false, reason: "not_configured" }
  if (!globalThis.crypto?.subtle) return { ok: false, reason: "unavailable" }
  const hash = await sha256Hex(password)
  return hash === env.roleHashes[role] ? { ok: true } : { ok: false, reason: "invalid" }
}
