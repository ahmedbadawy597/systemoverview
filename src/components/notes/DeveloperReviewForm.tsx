import { forwardRef, useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Clock, Loader2, Save } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DEV_LABELS, DEV_ORDER, type DevStatus, type Ticket } from "@/domain/ticket"
import { useUpdateDevReview } from "@/hooks/useTickets"
import {
  focusFirstFormError,
  localizeNoteFieldMessage,
  mapApiDetailsToFormErrors,
  NOTE_FORM_FIELD_IDS,
  NOTE_FORM_FIELD_MAP,
} from "@/lib/apiFieldErrors"
import { formatDateTime, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ApiError } from "@/services/api/http"
import { useAuth } from "@/services/auth/AuthProvider"
import { DEV_TONE } from "./StatusBadge"

const NOTES_MAX = 2000

const schema = z.object({
  devStatus: z.enum(["not_reviewed", "under_study", "resolved"]),
  devNotes: z.string().max(NOTES_MAX, `الحد الأقصى ${formatNumber(NOTES_MAX)} حرف.`),
})

type Values = z.infer<typeof schema>

const DOT: Record<string, string> = {
  idle: "bg-[var(--status-idle-dot)]",
  study: "bg-[var(--status-study-dot)]",
  resolved: "bg-[var(--status-resolved-dot)]",
}

interface DeveloperReviewFormProps {
  ticket: Ticket
  compact?: boolean
  onSaved?: () => void
}

export const DeveloperReviewForm = forwardRef<HTMLButtonElement, DeveloperReviewFormProps>(function DeveloperReviewForm(
  { ticket, compact, onSaved },
  statusRef,
) {
  const { can } = useAuth()
  const allowed = can("devReview")
  const update = useUpdateDevReview()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { devStatus: ticket.devStatus, devNotes: ticket.devNotes },
  })

  useEffect(() => {
    reset({ devStatus: ticket.devStatus, devNotes: ticket.devNotes })
    setFormError(null)
  }, [ticket.id, ticket.devStatus, ticket.devNotes, reset])

  const notesLength = watch("devNotes")?.length ?? 0
  const fieldId = `dev-${ticket.id}`
  const notesFieldId = `${fieldId}-notes`

  const submit = handleSubmit(async (values) => {
    if (!allowed || update.isPending) return
    setFormError(null)
    clearErrors()
    try {
      await update.mutateAsync({ id: ticket.id, ...values })
      onSaved?.()
    } catch (error) {
      if (error instanceof ApiError && error.details?.length) {
        const { fieldErrors, unmapped } = mapApiDetailsToFormErrors(
          error.details,
          NOTE_FORM_FIELD_MAP,
          localizeNoteFieldMessage,
        )
        const focusMap: Record<string, string> = {}
        for (const [key, message] of Object.entries(fieldErrors)) {
          if (key === "devNotes" || key === "devStatus") {
            setError(key, { type: "server", message })
            focusMap[key] = message
          }
        }
        if (!Object.keys(fieldErrors).length) {
          setFormError(error.message || unmapped[0] || "تعذّر حفظ المراجعة.")
        } else if (unmapped.length) {
          setFormError(unmapped[0])
        }
        queueMicrotask(() =>
          focusFirstFormError(focusMap, {
            ...NOTE_FORM_FIELD_IDS,
            devNotes: notesFieldId,
          }),
        )
        return
      }
      setFormError(error instanceof Error ? error.message : "تعذّر حفظ المراجعة.")
    }
  })

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      {formError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
          {formError}
        </p>
      )}

      <div className="grid gap-2">
        <Label id={`${fieldId}-status-label`} className="text-[13px] font-bold">
          حالة المبرمجين
        </Label>
        <Controller
          control={control}
          name="devStatus"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => {
                clearErrors("devStatus")
                setFormError(null)
                field.onChange(v as DevStatus)
              }}
              disabled={!allowed || update.isPending}
            >
              <SelectTrigger
                ref={statusRef}
                className="w-full"
                aria-labelledby={`${fieldId}-status-label`}
                aria-invalid={Boolean(errors.devStatus)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {DEV_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className={cn("size-2 rounded-full", DOT[DEV_TONE[s]])} aria-hidden />
                    {DEV_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.devStatus && (
          <p className="text-[13px] text-danger">{errors.devStatus.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={notesFieldId} className="text-[13px] font-bold">
            ملاحظات المبرمجين
          </Label>
          <span className="tabular text-xs text-muted-foreground" aria-hidden>
            {formatNumber(notesLength)} / {formatNumber(NOTES_MAX)}
          </span>
        </div>
        <Textarea
          id={notesFieldId}
          rows={compact ? 4 : 5}
          maxLength={NOTES_MAX}
          placeholder="اكتب التفاصيل الفنية: سبب المشكلة، وما تم أو ما سيتم لمعالجتها…"
          disabled={!allowed || update.isPending}
          aria-invalid={Boolean(errors.devNotes)}
          aria-describedby={errors.devNotes ? `${fieldId}-notes-error` : undefined}
          {...register("devNotes", {
            onChange: () => {
              clearErrors("devNotes")
              setFormError(null)
            },
          })}
        />
        {errors.devNotes && (
          <p id={`${fieldId}-notes-error`} className="text-[13px] text-danger">
            {errors.devNotes.message}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          آخر تحديث: <span className="tabular">{formatDateTime(ticket.devUpdatedAt)}</span>
        </p>
        {allowed && (
          <Button type="submit" disabled={update.isPending || !isDirty}>
            {update.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
            حفظ المراجعة
          </Button>
        )}
      </div>
    </form>
  )
})
