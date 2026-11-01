import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      dir="rtl"
      position="top-left"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-[18px] text-brand-btn" />,
        info: <InfoIcon className="size-[18px] text-brand" />,
        warning: <TriangleAlertIcon className="size-[18px] text-gold" />,
        error: <OctagonXIcon className="size-[18px] text-danger" />,
        loading: <Loader2Icon className="size-[18px] animate-spin text-brand" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--line)",
          "--border-radius": "12px",
          fontFamily: "var(--font-sans)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !shadow-float !gap-3 !py-3.5 !px-4",
          title: "!text-[14px] !font-semibold",
          description: "!text-[13px] !text-muted-foreground !leading-6",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
