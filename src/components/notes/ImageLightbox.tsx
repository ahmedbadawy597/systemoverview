import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"

interface ImageLightboxProps {
  images: string[]
  index: number | null
  title?: string
  onClose: () => void
}

export function ImageLightbox({ images, index, title, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(index ?? 0)

  useEffect(() => {
    if (index !== null) setCurrent(index)
  }, [index])

  const count = images.length
  const go = (delta: number) => setCurrent((c) => (c + delta + count) % count)

  return (
    <DialogPrimitive.Root open={index !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#0b1f1a]/90 data-open:animate-in data-open:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col outline-none data-open:animate-in data-open:fade-in-0"
          onKeyDown={(event) => {
            if (count < 2) return
            // RTL: the left arrow moves forward through the gallery.
            if (event.key === "ArrowLeft") go(1)
            if (event.key === "ArrowRight") go(-1)
          }}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6">
            <div className="min-w-0">
              <DialogPrimitive.Title className="truncate text-[14px] font-bold">{title ?? "معاينة الصورة"}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="tabular text-xs text-white/70">
                صورة {formatNumber(current + 1)} من {formatNumber(count)}
              </DialogPrimitive.Description>
            </div>
            <div className="flex items-center gap-1">
              {images[current] && (
                <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                  <a href={images[current]} download={`note-image-${current + 1}.jpg`} aria-label="تنزيل الصورة">
                    <Download className="size-5" />
                  </a>
                </Button>
              )}
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" aria-label="إغلاق المعاينة">
                  <X className="size-5" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-20" onClick={onClose}>
            {images[current] && (
              <img
                src={images[current]}
                alt={`${title ?? "صورة الملاحظة"} — صورة ${current + 1}`}
                className="max-h-full max-w-full rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {count > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="absolute top-1/2 start-3 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white sm:start-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    go(-1)
                  }}
                  aria-label="الصورة السابقة"
                >
                  <ChevronRight className="size-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="absolute top-1/2 end-3 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white sm:end-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    go(1)
                  }}
                  aria-label="الصورة التالية"
                >
                  <ChevronLeft className="size-6" />
                </Button>
              </>
            )}
          </div>

          {count > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-5">
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`size-14 flex-none overflow-hidden rounded-md ring-2 transition ${i === current ? "ring-gold-light" : "opacity-60 ring-transparent hover:opacity-100"}`}
                  aria-label={`عرض الصورة ${i + 1}`}
                  aria-current={i === current}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
