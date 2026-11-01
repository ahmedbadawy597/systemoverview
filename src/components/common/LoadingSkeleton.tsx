import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function TableSkeleton({ rows = 6, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div aria-hidden className="divide-y divide-line-soft">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex h-[60px] items-center gap-6 px-5">
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton
              key={c}
              className={cn("h-3.5", c === 1 ? "flex-[3]" : "flex-1", c === columns - 1 && "max-w-10 flex-none basis-10")}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden className="grid gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-2.5 rounded-xl border border-line bg-surface p-5">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ))}
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div aria-hidden className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid gap-4 rounded-xl border border-line bg-surface p-6">
        <Skeleton className="h-6 w-3/5" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-4/5" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
          <Skeleton className="aspect-[4/3]" />
        </div>
      </div>
      <div className="grid content-start gap-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}

/** The full-page placeholder shown while the protected layout restores its session. */
export function LoadingSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[148px] rounded-xl" />
        ))}
      </div>
      <div className="rounded-xl border border-line bg-surface">
        <TableSkeleton />
      </div>
    </div>
  )
}
