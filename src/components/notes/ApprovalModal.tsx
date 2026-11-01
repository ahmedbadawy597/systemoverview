import { BadgeCheck, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { Ticket } from "@/domain/ticket"
import { formatDate, formatId } from "@/lib/format"

interface ApprovalModalProps {
  ticket: Ticket | null
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ApprovalModal({ ticket, pending, onConfirm, onCancel }: ApprovalModalProps) {
  return (
    <AlertDialog open={ticket !== null} onOpenChange={(open) => !open && !pending && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <BadgeCheck />
          </AlertDialogMedia>
          <AlertDialogTitle>تصديق الملاحظة</AlertDialogTitle>
          <AlertDialogDescription className="leading-7">
            سيتم اعتماد الملاحظة وإتاحتها لمراجعة المبرمجين. لا يمكن التراجع عن التصديق من هذه الشاشة.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {ticket && (
          <div className="grid gap-1 rounded-lg bg-surface-soft p-4">
            <p className="tabular text-xs text-muted-foreground">
              ملاحظة رقم {formatId(ticket.id)} · أضيفت {formatDate(ticket.createdAt)}
            </p>
            <p className="text-[14px] leading-7 font-bold text-foreground">{ticket.name}</p>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="h-10">
            إلغاء
          </AlertDialogCancel>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <BadgeCheck aria-hidden />}
            تصديق الملاحظة
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
