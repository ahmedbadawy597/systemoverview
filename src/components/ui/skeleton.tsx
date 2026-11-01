import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-shimmer rounded-md bg-[#e8eeeb] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.65)_50%,transparent_100%)] bg-size-[200%_100%] bg-no-repeat", className)}
      {...props}
    />
  )
}

export { Skeleton }
