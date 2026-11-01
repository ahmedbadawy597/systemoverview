import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react"
import { Eye, EyeOff, KeyRound, Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { verifyRolePassword } from "@/services/auth/authService"
import { ROLES, type ProtectedRole } from "@/services/auth/roles"

export interface RolePasswordModalProps {
  open: boolean
  role: ProtectedRole
  title?: string
  description?: ReactNode
  confirmLabel?: string
  /** Extra content above the password field, e.g. print options. */
  children?: ReactNode
  onVerified: () => void
  onCancel: () => void
}

const REASONS = {
  invalid: "كلمة المرور غير صحيحة. حاول مرة أخرى.",
  not_configured: "لم يتم ضبط كلمة مرور لهذه الصلاحية بعد. تواصل مع مدير النظام.",
  unavailable: "التحقق غير متاح في هذا المتصفح. افتح النظام عبر اتصال آمن (https).",
}

export function RolePasswordModal({
  open,
  role,
  title,
  description,
  confirmLabel = "تأكيد",
  children,
  onVerified,
  onCancel,
}: RolePasswordModalProps) {
  const [password, setPassword] = useState("")
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fieldId = useId()
  const errorId = `${fieldId}-error`

  useEffect(() => {
    if (open) {
      setPassword("")
      setError(null)
      setVisible(false)
      setChecking(false)
    }
  }, [open, role])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!password) {
      setError("أدخل كلمة المرور للمتابعة.")
      inputRef.current?.focus()
      return
    }
    setChecking(true)
    const result = await verifyRolePassword(role, password)
    setChecking(false)
    if (result.ok) {
      setPassword("")
      onVerified()
      return
    }
    setError(REASONS[result.reason])
    setPassword("")
    inputRef.current?.focus()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          inputRef.current?.focus()
        }}
      >
        <form onSubmit={submit} className="grid gap-5" noValidate>
          <DialogHeader className="gap-3">
            <span className="flex size-11 items-center justify-center rounded-full bg-surface-tint text-brand">
              <KeyRound className="size-5" aria-hidden />
            </span>
            <DialogTitle>{title ?? `صلاحية ${ROLES[role].label}`}</DialogTitle>
            <DialogDescription className="leading-7">
              {description ?? `هذا الإجراء يتطلب صلاحية «${ROLES[role].label}». أدخل كلمة المرور الخاصة بها.`}
            </DialogDescription>
          </DialogHeader>

          {children}

          <div className="grid gap-2">
            <Label htmlFor={fieldId} className="text-[13px] font-semibold">
              كلمة مرور صلاحية {ROLES[role].label}
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id={fieldId}
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                dir="ltr"
                className="pe-11 text-start"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                disabled={checking}
              />
              <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-lg text-faint transition-colors hover:text-foreground"
                aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {error && (
              <p id={errorId} role="alert" className="flex items-start gap-1.5 text-[13px] leading-6 text-danger">
                <ShieldAlert className="mt-1 size-3.5 shrink-0" aria-hidden />
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={checking}>
              إلغاء
            </Button>
            <Button type="submit" disabled={checking}>
              {checking && <Loader2 className="animate-spin" aria-hidden />}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
