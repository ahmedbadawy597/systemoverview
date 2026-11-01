import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import type { Ticket } from "@/domain/ticket"
import { useApproveTicket, useDeleteTicket } from "@/hooks/useTickets"
import { shareOnWhatsApp } from "@/lib/whatsapp"
import { useAuth } from "@/services/auth/AuthProvider"
import { ApprovalModal } from "./ApprovalModal"
import { DeleteNoteDialog } from "./DeleteNoteDialog"

interface NoteActions {
  view: (ticket: Ticket) => void
  approve: (ticket: Ticket) => Promise<void>
  review: (ticket: Ticket) => Promise<void>
  remove: (ticket: Ticket, options?: { onDeleted?: () => void }) => Promise<void>
  share: (ticket: Ticket) => void
  approving: string | null
}

const Ctx = createContext<NoteActions | null>(null)

export function NoteActionsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { ensure } = useAuth()
  const approveMutation = useApproveTicket()
  const deleteMutation = useDeleteTicket()
  const [toApprove, setToApprove] = useState<Ticket | null>(null)
  const [toDelete, setToDelete] = useState<{ ticket: Ticket; onDeleted?: () => void } | null>(null)

  const approve = useCallback(
    async (ticket: Ticket) => {
      if (ticket.approval === "approved") return
      if (await ensure("approve")) setToApprove(ticket)
    },
    [ensure],
  )

  const review = useCallback(
    async (ticket: Ticket) => {
      if (await ensure("devReview")) navigate(`/notes/${encodeURIComponent(ticket.id)}?review=1`)
    },
    [ensure, navigate],
  )

  const remove = useCallback(
    async (ticket: Ticket, options?: { onDeleted?: () => void }) => {
      if (await ensure("delete")) setToDelete({ ticket, onDeleted: options?.onDeleted })
    },
    [ensure],
  )

  const value = useMemo<NoteActions>(
    () => ({
      view: (t) => navigate(`/notes/${encodeURIComponent(t.id)}`),
      approve,
      review,
      remove,
      share: shareOnWhatsApp,
      approving: approveMutation.isPending ? (approveMutation.variables ?? null) : null,
    }),
    [navigate, approve, review, remove, approveMutation.isPending, approveMutation.variables],
  )

  return (
    <Ctx.Provider value={value}>
      {children}
      <ApprovalModal
        ticket={toApprove}
        pending={approveMutation.isPending}
        onCancel={() => setToApprove(null)}
        onConfirm={() => {
          if (!toApprove) return
          approveMutation.mutate(toApprove.id, { onSettled: () => setToApprove(null) })
        }}
      />
      <DeleteNoteDialog
        ticket={toDelete?.ticket ?? null}
        pending={deleteMutation.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          const { ticket, onDeleted } = toDelete
          // The row leaves the cache optimistically, so leave its page before it renders as missing.
          onDeleted?.()
          deleteMutation.mutate(ticket.id, { onSettled: () => setToDelete(null) })
        }}
      />
    </Ctx.Provider>
  )
}

export function useNoteActions() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useNoteActions must be used inside NoteActionsProvider")
  return ctx
}
