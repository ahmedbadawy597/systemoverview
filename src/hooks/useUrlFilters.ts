import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { EMPTY_FILTERS, type TicketFilters } from "@/domain/stats"
import { APPROVAL_ORDER, DEV_ORDER, type ApprovalStatus, type DevStatus } from "@/domain/ticket"

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Filters live in the URL so links from the dashboard open pre-filtered and survive a reload. */
export function useUrlFilters(defaults: Partial<TicketFilters> = {}) {
  const [params, setParams] = useSearchParams()

  const filters = useMemo<TicketFilters>(() => {
    const approval = params.get("approval")
    const dev = params.get("status")
    const appId = params.get("app") ?? defaults.appId ?? "all"
    const from = params.get("from") ?? ""
    const to = params.get("to") ?? ""
    return {
      query: params.get("q") ?? defaults.query ?? "",
      approval: APPROVAL_ORDER.includes(approval as ApprovalStatus)
        ? (approval as ApprovalStatus)
        : (defaults.approval ?? "all"),
      devStatus: DEV_ORDER.includes(dev as DevStatus) ? (dev as DevStatus) : (defaults.devStatus ?? "all"),
      appId: appId || "all",
      from: DATE.test(from) ? from : "",
      to: DATE.test(to) ? to : "",
    }
  }, [params, defaults.query, defaults.approval, defaults.devStatus, defaults.appId])

  const setFilters = useCallback(
    (patch: Partial<TicketFilters>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const merged = { ...filters, ...patch }
          const write = (key: string, value: string, empty: string) => {
            if (value && value !== empty) next.set(key, value)
            else next.delete(key)
          }
          write("q", merged.query, "")
          write("approval", merged.approval, "all")
          write("status", merged.devStatus, "all")
          write("app", merged.appId, "all")
          write("from", merged.from, "")
          write("to", merged.to, "")
          return next
        },
        { replace: true },
      )
    },
    [filters, setParams],
  )

  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])

  return { filters, setFilters, clear, empty: EMPTY_FILTERS }
}
