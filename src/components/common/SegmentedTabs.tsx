import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface SegmentOption<T extends string> {
  value: T
  label: string
  count?: number
  dot?: string
}

interface SegmentedTabsProps<T extends string> {
  value: T
  options: SegmentOption<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
}

/** Count cards that double as the list's filter. */
export function SegmentedTabs<T extends string>({ value, options, onChange, label, className }: SegmentedTabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-2 overflow-x-auto pb-0.5", className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              const i = options.findIndex((o) => o.value === value)
              // RTL: ArrowLeft moves to the next tab.
              if (event.key === "ArrowLeft") onChange(options[(i + 1) % options.length].value)
              if (event.key === "ArrowRight") onChange(options[(i - 1 + options.length) % options.length].value)
            }}
            tabIndex={selected ? 0 : -1}
            className={cn(
              "flex min-w-[148px] flex-none flex-col items-start gap-1 rounded-lg border px-3.5 py-2.5 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              selected
                ? "border-brand-btn bg-surface-tint shadow-[inset_0_0_0_0.5px_var(--primary-btn)]"
                : "border-line bg-surface hover:border-input-border",
            )}
          >
            <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground">
              {option.dot && <span className="size-2 rounded-full" style={{ background: option.dot }} aria-hidden />}
              {option.label}
            </span>
            {option.count !== undefined && (
              <span className="tabular text-[18px] leading-tight font-bold text-foreground">{formatNumber(option.count)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
