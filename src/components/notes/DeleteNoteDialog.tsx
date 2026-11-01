import { Loader2, Trash2 } from "lucide-react"
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
import { formatId } from "@/lib/format"

interface DeleteNoteDialogProps {
  ticket: Ticket | null
  pending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteNoteDialog({ ticket, pending, onConfirm, onCancel }: DeleteNoteDialogProps) {
  return (
    <AlertDialog open={ticket !== null} onOpenChange={(open) => !open && !pending && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-[#fdecea] text-danger">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>حذف الملاحظة نهائيًا؟</AlertDialogTitle>
          <AlertDialogDescription className="leading-7">
            {ticket ? (
              <>
                سيتم حذف الملاحظة رقم <span className="tabular font-bold text-foreground">{formatId(ticket.id)}</span> «
                <span className="font-bold text-foreground">{ticket.name}</span>» من سجل الوزارة مع صورها وملاحظات
                المبرمجين. لا يمكن التراجع عن هذا الإجراء.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="h-10">
            إلغاء
          </AlertDialogCancel>
          <Button variant="danger" onClick={onConfirm} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Trash2 aria-hidden />}
            حذف الملاحظة
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
