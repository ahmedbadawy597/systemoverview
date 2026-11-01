export type ApiMode = "auto" | "gas" | "http" | "mock"

const rawMode = (import.meta.env.VITE_API_MODE ?? "auto") as string

export const env = {
  apiMode: (["auto", "gas", "http", "mock"].includes(rawMode) ? rawMode : "auto") as ApiMode,
  appsScriptUrl: (import.meta.env.VITE_APPS_SCRIPT_URL ?? "").trim(),
  roleHashes: {
    approver: (import.meta.env.VITE_ROLE_HASH_APPROVER ?? "").trim().toLowerCase(),
    developer: (import.meta.env.VITE_ROLE_HASH_DEVELOPER ?? "").trim().toLowerCase(),
    admin: (import.meta.env.VITE_ROLE_HASH_ADMIN ?? "").trim().toLowerCase(),
  },
}
