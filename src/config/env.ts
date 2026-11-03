export type ApiMode = "auto" | "nest" | "gas" | "http" | "mock"

const rawMode = (import.meta.env.VITE_API_MODE ?? "auto") as string

export const env = {
  apiMode: (["auto", "nest", "gas", "http", "mock"].includes(rawMode) ? rawMode : "auto") as ApiMode,
  /** NestJS API base including `/v1`. In Vite dev prefer `/v1` (proxied). */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? "/v1").replace(/\/$/, ""),
  appsScriptUrl: (import.meta.env.VITE_APPS_SCRIPT_URL ?? "").trim(),
  roleHashes: {
    approver: (import.meta.env.VITE_ROLE_HASH_APPROVER ?? "").trim().toLowerCase(),
    developer: (import.meta.env.VITE_ROLE_HASH_DEVELOPER ?? "").trim().toLowerCase(),
    admin: (import.meta.env.VITE_ROLE_HASH_ADMIN ?? "").trim().toLowerCase(),
  },
}

export function usesNestApi() {
  if (env.apiMode === "nest") return true
  if (env.apiMode === "gas" || env.apiMode === "http" || env.apiMode === "mock") return false
  return Boolean(env.apiBaseUrl)
}
