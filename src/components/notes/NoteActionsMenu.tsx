import { BadgeCheck, Eye, Lock, MessageCircle, MoreHorizontal, Trash2, Wrench } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import type { Ticket } from "@/domain/ticket"
import { formatId } from "@/lib/format"
import { useAuth } from "@/services/auth/AuthProvider"
import { useNoteActions } from "./NoteActionsProvider"

export function NoteActionsMenu({ ticket, hideView }: { ticket: Ticket; hideView?: boolean }) {
  const actions = useNoteActions()
  const { can } = useAuth()
  const locked = (permission: Parameters<typeof can>[0]) =>
    !can(permission) && <Lock className="ms-auto size-3.5 text-faint" aria-label="يتطلب كلمة مرور" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-faint hover:text-foreground data-[state=open]:bg-surface-soft"
          aria-label={`إجراءات الملاحظة رقم ${formatId(ticket.id)}`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5" onClick={(e) => e.stopPropagation()}>
        {!hideView && (
          <DropdownMenuItem className="h-9" onSelect={() => actions.view(ticket)}>
            <Eye />
            عرض التفاصيل
          </DropdownMenuItem>
        )}
        {ticket.approval === "pending" ? (
          <DropdownMenuItem className="h-9" onSelect={() => void actions.approve(ticket)}>
            <BadgeCheck />
            تصديق الملاحظة
            {locked("approve")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem className="h-9" disabled>
            <BadgeCheck />
            تم التصديق
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="h-9" onSelect={() => void actions.review(ticket)}>
          <Wrench />
          مراجعة المبرمجين
          {locked("devReview")}
        </DropdownMenuItem>
        <DropdownMenuItem className="h-9" onSelect={() => actions.share(ticket)}>
          <MessageCircle />
          مشاركة عبر واتساب
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="h-9" onSelect={() => void actions.remove(ticket)}>
          <Trash2 />
          حذف الملاحظة
          {locked("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
