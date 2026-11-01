import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { NewTicketInput } from "@/domain/ticket"
import { formatBytes, formatNumber } from "@/lib/format"
import { ImageUploader, type UploadItem } from "./ImageUploader"

const NAME_MAX = 150
const DESC_MAX = 3000

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "اسم الملاحظة مطلوب.")
    .min(3, "اكتب اسمًا لا يقل عن ٣ أحرف.")
    .max(NAME_MAX, `الحد الأقصى ${formatNumber(NAME_MAX)} حرفًا.`),
  description: z
    .string()
    .trim()
    .min(1, "وصف الملاحظة مطلوب.")
    .min(10, "اكتب وصفًا لا يقل عن ١٠ أحرف يوضح الملاحظة.")
    .max(DESC_MAX, `الحد الأقصى ${formatNumber(DESC_MAX)} حرف.`),
})

type FormValues = z.infer<typeof schema>

interface NoteFormProps {
  submitting: boolean
  onSubmit: (input: NewTicketInput) => void
  onCancel: (dirty: boolean) => void
}

export function NoteForm({ submitting, onSubmit, onCancel }: NoteFormProps) {
  const [images, setImages] = useState<UploadItem[]>([])
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
    mode: "onTouched",
  })

  const compressing = images.some((i) => i.status === "compressing")
  const ready = images.filter((i) => i.status === "ready")
  const payloadBytes = ready.reduce((n, i) => n + (i.compressedBytes ?? 0), 0)
  const nameLength = watch("name")?.length ?? 0
  const descLength = watch("description")?.length ?? 0

  const submit = handleSubmit((values) =>
    onSubmit({ name: values.name, description: values.description, images: ready.map((i) => i.dataUrl!) }),
  )

  return (
    <form onSubmit={submit} noValidate className="grid gap-0">
      <div className="grid gap-7 p-5 sm:p-7">
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="note-name" className="text-[14px] font-bold">
              اسم الملاحظة <span className="text-danger" aria-hidden>*</span>
            </Label>
            <span className="tabular text-xs text-muted-foreground" aria-hidden>
              {formatNumber(nameLength)} / {formatNumber(NAME_MAX)}
            </span>
          </div>
          <Input
            id="note-name"
            placeholder="أدخل اسم الملاحظة..."
            maxLength={NAME_MAX}
            aria-required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "note-name-error" : undefined}
            disabled={submitting}
            className="h-11 text-[15px]"
            {...register("name")}
          />
          {errors.name && (
            <p id="note-name-error" className="text-[13px] text-danger">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="note-description" className="text-[14px] font-bold">
              وصف الملاحظة <span className="text-danger" aria-hidden>*</span>
            </Label>
            <span className="tabular text-xs text-muted-foreground" aria-hidden>
              {formatNumber(descLength)} / {formatNumber(DESC_MAX)}
            </span>
          </div>
          <Textarea
            id="note-description"
            placeholder="اكتب تفاصيل الملاحظة..."
            rows={7}
            maxLength={DESC_MAX}
            aria-required
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "note-description-error" : "note-description-hint"}
            disabled={submitting}
            className="min-h-44 text-[15px]"
            {...register("description")}
          />
          {errors.description ? (
            <p id="note-description-error" className="text-[13px] text-danger">
              {errors.description.message}
            </p>
          ) : (
            <p id="note-description-hint" className="text-xs text-muted-foreground">
              اذكر مكان الملاحظة وخطوات ظهورها وأثرها على المستخدم.
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-baseline gap-2">
            <p className="text-[14px] font-bold" id="note-images-label">
              إرفاق الصور
            </p>
            <span className="text-xs text-muted-foreground">اختياري</span>
          </div>
          <div role="group" aria-labelledby="note-images-label">
            <ImageUploader value={images} onChange={setImages} disabled={submitting} />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line-soft bg-surface-soft/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {submitting
            ? ready.length
              ? `جارٍ حفظ الملاحظة ورفع ${formatNumber(ready.length)} صورة (${formatBytes(payloadBytes)})…`
              : "جارٍ حفظ الملاحظة…"
            : compressing
              ? "انتظر حتى يكتمل ضغط الصور."
              : isSubmitted && Object.keys(errors).length
                ? "راجع الحقول المطلوبة قبل الحفظ."
                : "ستُحفظ الملاحظة بحالة «بانتظار التصديق»."}
        </p>
        <div className="flex gap-2 sm:flex-row-reverse">
          <Button type="submit" size="lg" disabled={submitting || compressing} className="flex-1 sm:flex-none">
            {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            حفظ الملاحظة
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={submitting}
            onClick={() => onCancel(isDirty || images.length > 0)}
            className="flex-1 sm:flex-none"
          >
            إلغاء
          </Button>
        </div>
      </div>
    </form>
  )
}
