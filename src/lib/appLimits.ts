/** Keep in sync with backend `MAX_APP_USERS_COUNT`. */
export const MAX_APP_USERS_COUNT = 1_000_000

/**
 * Parse a strict integer string (optional leading minus).
 * Rejects decimals, letters, symbols, and empty/whitespace-only values.
 */
export function parseStrictInteger(raw: string): number | null {
  const value = raw.trim()
  if (!/^-?\d+$/.test(value)) return null
  const n = Number(value)
  if (!Number.isSafeInteger(n)) return null
  return n
}
