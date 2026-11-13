import { useId, useRef, useState, type DragEvent } from "react"
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react"
import {
  ACCEPTED_IMAGE_ACCEPT,
  ACCEPTED_IMAGE_TYPES,
  MAX_SOURCE_BYTES,
  compressToJpeg,
  isRejectedImageFile,
} from "@/lib/image"
import { formatBytes, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ImageLightbox } from "./ImageLightbox"

export interface UploadItem {
  id: string
  name: string
  status: "compressing" | "ready" | "error"
  dataUrl?: string
  originalBytes: number
  compressedBytes?: number
  error?: string
}

interface ImageUploaderProps {
  value: UploadItem[]
  onChange: (updater: (items: UploadItem[]) => UploadItem[]) => void
  maxFiles?: number
  disabled?: boolean
}

let counter = 0

export function ImageUploader({ value, onChange, maxFiles = 8, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [preview, setPreview] = useState<number | null>(null)
  const hintId = useId()

  const ready = value.filter((i) => i.status === "ready")
  const remaining = maxFiles - value.length

  function addFiles(list: FileList | File[]) {
    setNotice(null)
    const files = Array.from(list)
    const rejectedSvg = files.some(isRejectedImageFile)
    const images = files.filter(
      (f) =>
        !isRejectedImageFile(f) &&
        ((ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type) ||
          (!f.type && /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name))),
    )
    if (images.length < files.length) {
      setNotice(
        rejectedSvg
          ? "تم رفض ملفات SVG أو الصيغ غير المدعومة. يُسمح فقط بـ JPG و PNG و WEBP."
          : "تم تجاهل الملفات التي ليست صورًا.",
      )
    }
    const accepted = images.slice(0, Math.max(0, remaining))
    if (images.length > accepted.length) setNotice(`الحد الأقصى ${formatNumber(maxFiles)} صور لكل ملاحظة.`)

    const items: UploadItem[] = accepted.map((file) => ({
      id: `img-${Date.now()}-${counter++}`,
      name: file.name,
      status: file.size > MAX_SOURCE_BYTES ? "error" : "compressing",
      originalBytes: file.size,
      error: file.size > MAX_SOURCE_BYTES ? `حجم الصورة أكبر من ${formatBytes(MAX_SOURCE_BYTES)}.` : undefined,
    }))
    if (items.length === 0) return
    onChange((prev) => [...prev, ...items])

    items.forEach((item, index) => {
      if (item.status === "error") return
      compressToJpeg(accepted[index])
        .then((result) =>
          onChange((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: "ready", dataUrl: result.dataUrl, compressedBytes: result.compressedBytes } : p,
            ),
          ),
        )
        .catch((error: Error) =>
          onChange((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "error", error: error.message } : p))),
        )
    })
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files)
  }

  const originalTotal = ready.reduce((n, i) => n + i.originalBytes, 0)
  const compressedTotal = ready.reduce((n, i) => n + (i.compressedBytes ?? 0), 0)

  return (
    <div className="grid gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-[1.5px] border-dashed px-6 py-9 text-center transition-colors",
          dragging ? "border-brand-btn bg-surface-tint" : "border-input-border bg-input-bg",
          (disabled || remaining <= 0) && "opacity-60",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-surface text-brand ring-1 ring-line">
          <ImagePlus className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="grid gap-1">
          <p className="text-[14px] font-semibold text-foreground">
            اسحب الصور وأفلتها هنا، أو{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || remaining <= 0}
              className="font-bold text-brand-btn underline-offset-4 hover:underline focus-visible:underline disabled:no-underline"
              aria-describedby={hintId}
            >
              اختر من جهازك
            </button>
          </p>
          <p id={hintId} className="text-xs leading-5 text-muted-foreground">
            حتى {formatNumber(maxFiles)} صور، {formatBytes(MAX_SOURCE_BYTES)} لكل صورة. تُضغط الصور تلقائيًا بصيغة JPEG قبل الحفظ.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-1.5 text-[13px] text-[var(--status-pending-ink)]">
          <AlertCircle className="size-3.5" aria-hidden />
          {notice}
        </p>
      )}

      {value.length > 0 && (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="الصور المرفقة">
            {value.map((item) => {
              const readyIndex = ready.findIndex((r) => r.id === item.id)
              return (
                <li key={item.id} className="group relative overflow-hidden rounded-lg border border-line bg-surface">
                  <div className="relative aspect-[4/3] bg-surface-soft">
                    {item.dataUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreview(readyIndex)}
                        className="block size-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                        aria-label={`معاينة ${item.name}`}
                      >
                        <img src={item.dataUrl} alt="" className="size-full object-cover" />
                      </button>
                    ) : item.status === "compressing" ? (
                      <div className="flex size-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="size-5 animate-spin text-brand" aria-hidden />
                        جارٍ ضغط الصورة…
                      </div>
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-1.5 px-3 text-center text-xs text-danger">
                        <AlertCircle className="size-5" aria-hidden />
                        {item.error}
                      </div>
                    )}
                    {item.status === "compressing" && (
                      <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-line">
                        <div className="h-full w-1/3 animate-[upload-progress_1.1s_ease-in-out_infinite] bg-brand-btn" />
                      </div>
                    )}
                  </div>
                  <div className="grid gap-0.5 px-2.5 py-2">
                    <p className="truncate text-xs font-semibold text-foreground" dir="auto" title={item.name}>
                      {item.name}
                    </p>
                    <p className="tabular text-[11px] text-muted-foreground">
                      {item.status === "ready" && item.compressedBytes !== undefined
                        ? `${formatBytes(item.originalBytes)} ← ${formatBytes(item.compressedBytes)}`
                        : formatBytes(item.originalBytes)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange((prev) => prev.filter((p) => p.id !== item.id))}
                    disabled={disabled}
                    className="absolute top-2 end-2 flex size-7 items-center justify-center rounded-full bg-white/95 text-foreground shadow-float transition-colors hover:bg-[#fdecea] hover:text-danger"
                    aria-label={`إزالة ${item.name}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>
          {ready.length > 0 && (
            <p className="tabular text-xs text-muted-foreground" aria-live="polite">
              {formatNumber(ready.length)} صورة جاهزة · الحجم بعد الضغط {formatBytes(compressedTotal)} بدلًا من {formatBytes(originalTotal)}
            </p>
          )}
        </>
      )}

      <ImageLightbox
        images={ready.map((r) => r.dataUrl!)}
        index={preview}
        title="الصور المرفقة"
        onClose={() => setPreview(null)}
      />
    </div>
  )
}
