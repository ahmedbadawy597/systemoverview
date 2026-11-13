export interface CompressedImage {
  dataUrl: string
  originalBytes: number
  compressedBytes: number
  width: number
  height: number
}

/** Raster formats accepted by the Add Note image field (SVG is never accepted). */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const

export const ACCEPTED_IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.heic,.heif"

export const MAX_SOURCE_BYTES = 15 * 1024 * 1024

export function isRejectedImageFile(file: File): boolean {
  const mime = (file.type || "").toLowerCase()
  const name = file.name || ""
  if (mime.includes("svg") || mime.includes("xml") || /\.svg$/i.test(name)) {
    return true
  }
  if (mime && !mime.startsWith("image/")) {
    return true
  }
  if (mime && !(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mime)) {
    return true
  }
  return false
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (isRejectedImageFile(file)) {
      reject(new Error("صيغة SVG أو الملفات غير النقطية غير مدعومة. استخدم JPG أو PNG أو WEBP."))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("تعذّر قراءة الصورة. قد تكون الصيغة غير مدعومة في هذا المتصفح."))
    }
    img.src = url
  })
}

function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1)
  return Math.floor((base64.length * 3) / 4)
}

/** Re-encodes any browser-readable image as JPEG, fitting the long edge within maxEdge. */
export async function compressToJpeg(file: File, maxEdge = 1600, quality = 0.8): Promise<CompressedImage> {
  const img = await loadImage(file)
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("المتصفح لا يدعم معالجة الصور.")
  // JPEG has no alpha; paint white so transparent PNGs do not turn black.
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  const dataUrl = canvas.toDataURL("image/jpeg", quality)
  return { dataUrl, originalBytes: file.size, compressedBytes: dataUrlBytes(dataUrl), width, height }
}
