import { ExternalLink, KeyRound, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAppInterfaces } from "@/hooks/useApps"

interface AppCredentialsDialogProps {
  appId: string | null
  appName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppCredentialsDialog({ appId, appName, open, onOpenChange }: AppCredentialsDialogProps) {
  const query = useAppInterfaces(appId ?? undefined, open && Boolean(appId))
  const rows = query.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" aria-hidden />
            واجهات الدخول — {appName}
          </DialogTitle>
          <DialogDescription>بيانات الدخول الفنية للمساعد/المدير فقط. لا تُعرض للوزير.</DialogDescription>
        </DialogHeader>

        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            جارٍ التحميل…
          </div>
        ) : query.error ? (
          <p className="py-6 text-center text-[13px] text-destructive">تعذّر تحميل الواجهات.</p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">لا توجد واجهات مسجّلة لهذا التطبيق.</p>
        ) : (
          <ul className="grid max-h-[60vh] gap-3 overflow-y-auto pe-1">
            {rows.map((row) => (
              <li key={row.id} className="grid gap-2 rounded-lg border border-line bg-surface-soft/50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{row.label}</p>
                  {row.url && (
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <a href={row.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-3.5" aria-hidden />
                        فتح
                      </a>
                    </Button>
                  )}
                </div>
                <dl className="grid gap-1 text-[13px]">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">المستخدم</dt>
                    <dd className="font-mono text-foreground" dir="ltr">
                      {row.username || "—"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">كلمة المرور</dt>
                    <dd className="font-mono text-foreground" dir="ltr">
                      {row.password || (row.hasPassword ? "••••••••" : "—")}
                    </dd>
                  </div>
                  {row.url && (
                    <div className="flex gap-2">
                      <dt className="shrink-0 text-muted-foreground">الرابط</dt>
                      <dd className="break-all font-mono text-[12px] text-foreground" dir="ltr">
                        {row.url}
                      </dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
