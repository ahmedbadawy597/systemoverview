import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Ticket } from "@/domain/ticket"
import { formatMonth, formatMonthYear, formatNumber } from "@/lib/format"

interface MonthlyChartProps {
  tickets: Ticket[]
  months?: number
}

/** Notes added per month over the last N months, split by approval so the queue's age is visible. */
export function MonthlyChart({ tickets, months = 6 }: MonthlyChartProps) {
  const data = useMemo(() => {
    const now = new Date()
    const buckets = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
      return { key: `${d.getFullYear()}-${d.getMonth()}`, date: d, approved: 0, pending: 0 }
    })
    const index = new Map(buckets.map((b, i) => [b.key, i]))
    for (const t of tickets) {
      const d = new Date(t.createdAt)
      const i = index.get(`${d.getFullYear()}-${d.getMonth()}`)
      if (i === undefined) continue
      if (t.approval === "approved") buckets[i].approved += 1
      else buckets[i].pending += 1
    }
    return buckets.map((b) => ({ ...b, label: formatMonth(b.date), full: formatMonthYear(b.date) }))
  }, [tickets, months])

  const max = Math.max(1, ...data.map((d) => d.approved + d.pending))
  const step = max <= 4 ? 1 : max <= 10 ? 2 : Math.ceil(max / 4)
  const top = Math.ceil((max + 0.5) / step) * step
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step)

  return (
    <div className="h-[240px] w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={[...data].reverse()} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#edf1ef" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "#bec9c3" }}
            tick={{ fill: "#5c6863", fontSize: 12, fontFamily: "Cairo" }}
          />
          <YAxis
            orientation="right"
            ticks={ticks}
            domain={[0, top]}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={28}
            tickFormatter={(v: number) => formatNumber(v)}
            tick={{ fill: "#5c6863", fontSize: 12, fontFamily: "Cairo" }}
          />
          <Tooltip
            cursor={{ fill: "rgba(20,83,61,0.05)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const row = payload[0].payload as (typeof data)[number]
              return (
                <div dir="rtl" className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-float">
                  <p className="mb-1 font-bold text-foreground">{row.full}</p>
                  <p className="text-muted-foreground">
                    تم التصديق: <span className="tabular font-bold text-foreground">{formatNumber(row.approved)}</span>
                  </p>
                  <p className="text-muted-foreground">
                    بانتظار التصديق: <span className="tabular font-bold text-foreground">{formatNumber(row.pending)}</span>
                  </p>
                </div>
              )
            }}
          />
          <Bar dataKey="approved" stackId="a" fill="#14533d" maxBarSize={44} />
          <Bar dataKey="pending" stackId="a" fill="#c5a869" radius={[3, 3, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
