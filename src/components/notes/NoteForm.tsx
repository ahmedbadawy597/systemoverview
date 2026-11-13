import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { AppWindow, CheckCircle2, Loader2, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { NewTicketInput } from "@/domain/ticket"
import { useAppsList } from "@/hooks/useApps"
import {
  focusFirstFormError,
  localizeNoteFieldMessage,
  mapApiDetailsToFormErrors,
  NOTE_FORM_FIELD_IDS,
  NOTE_FORM_FIELD_MAP,
} from "@/lib/apiFieldErrors"
import { cn } from "@/lib/utils"
import { formatBytes, formatNumber } from "@/lib/format"
import { ApiError } from "@/services/api/http"
import { useAuth } from "@/services/auth/AuthProvider"
import { ImageUploader, type UploadItem } from "./ImageUploader"

const NAME_MAX = 150
const DESC_MAX = 3000
const NONE_APP = "__none__"

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
  appId: z.string().nullable().optional(),
})

type FormValues = z.infer<typeof schema>

interface NoteFormProps {
  submitting: boolean
  /** Resolves on success; may throw ApiError with field `details`. */
  onSubmit: (input: NewTicketInput) => Promise<void>
  onCancel: (dirty: boolean) => void
}

export function NoteForm({ submitting, onSubmit, onCancel }: NoteFormProps) {
  const [images, setImages] = useState<UploadItem[]>([])
  const [imagesError, setImagesError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const { canViewApps } = useAuth()
  const appsQuery = useAppsList({ page: 1, limit: 100, status: "published" }, canViewApps)
  const apps = useMemo(() => appsQuery.data?.items ?? [], [appsQuery.data])
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", appId: null },
    mode: "onTouched",
  })

  const compressing = images.some((i) => i.status === "compressing")
  const ready = images.filter((i) => i.status === "ready")
  const payloadBytes = ready.reduce((n, i) => n + (i.compressedBytes ?? 0), 0)
  const nameLength = watch("name")?.length ?? 0
  const descLength = watch("description")?.length ?? 0
  const selectedAppId = watch("appId") ?? null
  const selectedApp = apps.find((a) => a.id === selectedAppId) ?? null

  function applyServerValidation(error: ApiError) {
    const { fieldErrors, unmapped } = mapApiDetailsToFormErrors(
      error.details,
      NOTE_FORM_FIELD_MAP,
      localizeNoteFieldMessage,
    )

    clearErrors()
    setImagesError(null)

    const focusMap: Record<string, string> = {}
    for (const [key, message] of Object.entries(fieldErrors)) {
      if (key === "images") {
        setImagesError(message)
        focusMap.images = message
        continue
      }
      if (key === "name" || key === "description" || key === "appId") {
        setError(key, { type: "server", message })
        focusMap[key] = message
      }
    }

    if (!Object.keys(fieldErrors).length) {
      setFormError(error.message || unmapped[0] || "تعذّر حفظ الملاحظة. حاول مرة أخرى.")
    } else if (unmapped.length) {
      setFormError(unmapped[0])
    } else {
      setFormError(null)
    }

    queueMicrotask(() => focusFirstFormError(focusMap, NOTE_FORM_FIELD_IDS))
  }

  const submit = handleSubmit(async (values) => {
    if (submitting || compressing) return
    setFormError(null)
    setImagesError(null)
    clearErrors()

    try {
      await onSubmit({
        name: values.name,
        description: values.description,
        appId: values.appId || null,
        images: ready.map((i) => i.dataUrl!),
      })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details?.length) {
          applyServerValidation(error)
          return
        }
        setFormError(error.message || "تعذّر حفظ الملاحظة. حاول مرة أخرى.")
        return
      }
      setFormError(error instanceof Error ? error.message : "تعذّر حفظ الملاحظة. حاول مرة أخرى.")
    }
  })

  return (
    <form onSubmit={submit} noValidate className="grid gap-0">
      <div className="grid gap-7 p-5 sm:p-7">
        {formError && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive"
          >
            {formError}
          </p>
        )}

        <section className="grid gap-3 rounded-xl border border-line bg-surface-soft/40 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
              <AppWindow className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="grid min-w-0 flex-1 gap-1">
              <Label htmlFor="note-app" className="text-[14px] font-bold text-foreground">
                التطبيق المرتبط
                <span className="ms-2 text-xs font-normal text-muted-foreground">اختياري</span>
              </Label>
              <p className="text-[12.5px] leading-5 text-muted-foreground">
                اربط الملاحظة بمنظومة التحول الرقمي المعنية لتسهيل المتابعة والتصفية لاحقًا.
              </p>
            </div>
          </div>

          <Select
            value={selectedAppId ?? NONE_APP}
            onValueChange={(value) => {
              clearErrors("appId")
              setFormError(null)
              if (value === NONE_APP) {
                setValue("appId", null, { shouldDirty: true })
                return
              }
              setValue("appId", value, { shouldDirty: true })
              const app = apps.find((a) => a.id === value)
              if (app && !watch("name")?.trim()) {
                setValue("name", `ملاحظة على ${app.name}`, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            }}
            disabled={submitting || appsQuery.isLoading}
          >
            <SelectTrigger
              id="note-app"
              className="h-11 bg-surface text-[15px]"
              aria-invalid={Boolean(errors.appId)}
            >
              <SelectValue
                placeholder={appsQuery.isLoading ? "جارٍ تحميل التطبيقات…" : "اختر التطبيق المرتبط"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_APP}>بدون ربط بتطبيق</SelectItem>
              {apps.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.appId && (
            <p className="text-[13px] text-danger">{errors.appId.message}</p>
          )}

          {appsQuery.isError && (
            <p className="text-[12.5px] text-destructive">تعذّر تحميل قائمة التطبيقات. يمكنك المتابعة دون ربط.</p>
          )}

          {selectedApp ? (
            <div
              className={cn(
                "flex items-start gap-2.5 rounded-lg border border-brand/20 bg-brand/[0.06] px-3 py-2.5 text-[12.5px] leading-5 text-foreground",
              )}
            >
              <CheckCircle2 className="mt-0.5 size-4 flex-none text-brand" aria-hidden />
              <div className="grid gap-0.5">
                <p className="font-semibold">{selectedApp.name}</p>
                <p className="text-muted-foreground">
                  {selectedApp.description?.trim() || "سيظهر اسم التطبيق في سجل الملاحظات ولوحة التصفية."}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              عند اختيار تطبيق، يُقترح اسم الملاحظة تلقائيًا إذا كان حقل الاسم فارغًا.
            </p>
          )}
        </section>

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
            {...register("name", {
              onChange: () => {
                clearErrors("name")
                setFormError(null)
              },
            })}
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
            {...register("description", {
              onChange: () => {
                clearErrors("description")
                setFormError(null)
              },
            })}
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
          <div
            role="group"
            aria-labelledby="note-images-label"
            aria-invalid={imagesError ? true : undefined}
            className={cn(imagesError && "rounded-xl ring-2 ring-destructive/30")}
          >
            <ImageUploader
              value={images}
              onChange={(updater) => {
                setImagesError(null)
                setFormError(null)
                setImages(updater)
              }}
              disabled={submitting}
            />
          </div>
          {imagesError && (
            <p className="text-[13px] text-danger" role="alert">
              {imagesError}
            </p>
          )}
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
              : formError || imagesError || (isSubmitted && Object.keys(errors).length)
                ? "راجع الحقول المعلّمة قبل الحفظ."
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
