import type { ComponentProps } from "react"
import { ImageOff, Loader2 } from "lucide-react"
import { useAuthenticatedImage } from "@/hooks/useAuthenticatedImage"
import { cn } from "@/lib/utils"

interface AuthenticatedImageProps extends Omit<ComponentProps<"img">, "src"> {
  src: string
  fallbackClassName?: string
}

/** Renders private note images via JWT-authenticated API proxy. */
export function AuthenticatedImage({
  src,
  alt,
  className,
  fallbackClassName,
  ...rest
}: AuthenticatedImageProps) {
  const { src: resolved, loading, error } = useAuthenticatedImage(src)

  if (loading) {
    return (
      <span
        className={cn(
          "flex size-full items-center justify-center bg-surface-soft text-muted-foreground",
          fallbackClassName ?? className,
        )}
        aria-busy
        aria-label="جارٍ تحميل الصورة"
      >
        <Loader2 className="size-5 animate-spin" aria-hidden />
      </span>
    )
  }

  if (!resolved || error) {
    return (
      <span
        className={cn(
          "flex size-full items-center justify-center bg-surface-soft text-muted-foreground",
          fallbackClassName ?? className,
        )}
        role="img"
        aria-label={error === "UNAUTHORIZED" ? "يلزم تسجيل الدخول لعرض الصورة" : "تعذّر تحميل الصورة"}
      >
        <ImageOff className="size-5" aria-hidden />
      </span>
    )
  }

  return <img src={resolved} alt={alt} className={className} {...rest} />
}
