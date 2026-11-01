import { cn } from "@/lib/utils"

/** The official logo, unaltered. Every screen and the printed report use this one file. */
export const LOGO_SRC = `${import.meta.env.BASE_URL}brand/awqaf-logo.jpg`
const LOGO_NATIVE_SIZE = 260

interface LogoProps {
  /** Rendered width and height in CSS pixels; the asset is square. */
  size?: number
  className?: string
}

export function Logo({ size = 56, className }: LogoProps) {
  return (
    <img
      src={LOGO_SRC}
      width={size}
      height={size}
      alt="شعار وزارة الأوقاف المصرية"
      decoding="async"
      draggable={false}
      style={{ width: size, height: size, maxWidth: LOGO_NATIVE_SIZE }}
      // The asset is a JPG on white; multiply lets tinted grounds show through without altering it.
      className={cn("block flex-none object-contain mix-blend-multiply select-none", className)}
    />
  )
}
