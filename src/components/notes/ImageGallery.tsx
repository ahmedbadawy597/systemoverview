import { useState } from "react"
import { Expand } from "lucide-react"
import { ImageLightbox } from "./ImageLightbox"

export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null)
  if (images.length === 0) return null

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((src, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface-soft ring-1 ring-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              aria-label={`عرض الصورة ${i + 1} بحجم كامل`}
            >
              <img src={src} alt={`${title} — صورة ${i + 1}`} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
              <span className="absolute bottom-2 end-2 flex size-8 items-center justify-center rounded-full bg-white/95 text-foreground opacity-0 shadow-float transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Expand className="size-4" aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <ImageLightbox images={images} index={index} title={title} onClose={() => setIndex(null)} />
    </>
  )
}
