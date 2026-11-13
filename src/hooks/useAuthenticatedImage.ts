import { useEffect, useState } from "react"
import { env } from "@/config/env"
import { getAccessToken } from "@/services/api/session"

function isPrivateApiImage(src: string): boolean {
  if (!src) return false
  if (src.startsWith("data:") || src.startsWith("blob:")) return false
  // Relative authenticated proxy: /v1/tickets/:id/images/:index
  if (/^\/v1\/tickets\/[^/]+\/images\/\d+$/i.test(src)) return true
  // Absolute API URL pointing at the same proxy path
  try {
    const base = env.apiBaseUrl.replace(/\/$/, "")
    if (src.startsWith(`${base}/tickets/`) && /\/images\/\d+$/i.test(src)) return true
    if (src.includes("/v1/tickets/") && /\/images\/\d+$/i.test(src)) return true
  } catch {
    // ignore
  }
  return false
}

function toFetchUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src
  if (src.startsWith("/v1/")) {
    // Vite proxy serves /v1; if apiBaseUrl is absolute, prefer that host.
    const base = env.apiBaseUrl
    if (base.startsWith("http")) {
      return `${base.replace(/\/v1\/?$/, "")}${src}`
    }
    return src
  }
  if (src.startsWith("/")) return `${env.apiBaseUrl}${src}`
  return `${env.apiBaseUrl}/${src}`
}

/**
 * Loads private note images through the authenticated API proxy.
 * Public/data/blob URLs are returned as-is.
 */
export function useAuthenticatedImage(src: string | undefined | null) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null

    async function load() {
      setError(null)
      if (!src) {
        setObjectUrl(null)
        setLoading(false)
        return
      }

      if (!isPrivateApiImage(src)) {
        setObjectUrl(src)
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const token = getAccessToken()
        if (!token) {
          throw new Error("UNAUTHORIZED")
        }
        const response = await fetch(toFetchUrl(src), {
          headers: { Authorization: `Bearer ${token}`, Accept: "image/*" },
        })
        if (response.status === 401) throw new Error("UNAUTHORIZED")
        if (response.status === 403) throw new Error("FORBIDDEN")
        if (response.status === 404) throw new Error("NOT_FOUND")
        if (!response.ok) throw new Error(`HTTP_${response.status}`)
        const blob = await response.blob()
        createdUrl = URL.createObjectURL(blob)
        if (!cancelled) setObjectUrl(createdUrl)
      } catch (err) {
        if (!cancelled) {
          setObjectUrl(null)
          setError(err instanceof Error ? err.message : "LOAD_FAILED")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [src])

  return { src: objectUrl, loading, error }
}
