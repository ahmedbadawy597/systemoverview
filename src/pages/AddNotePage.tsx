import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { PermissionEmpty } from "@/components/common/PermissionEmpty"
import { PageHeader, Panel } from "@/components/layout/PageHeader"
import { NoteForm } from "@/components/notes/NoteForm"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAddTicket } from "@/hooks/useTickets"
import { formatId } from "@/lib/format"
import { useAuth } from "@/services/auth/AuthProvider"

export function AddNotePage() {
  const { can } = useAuth()
  const navigate = useNavigate()
  const addTicket = useAddTicket()
  const [confirmLeave, setConfirmLeave] = useState(false)

  if (!can("create")) {
    return (
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <PageHeader title="إضافة ملاحظة جديدة" description="قم بإدخال بيانات الملاحظة وإرفاق الصور إن وجدت." />
        <PermissionEmpty permission="create" />
      </div>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <PageHeader title="إضافة ملاحظة جديدة" description="قم بإدخال بيانات الملاحظة وإرفاق الصور إن وجدت." />

      <Panel className="overflow-hidden">
        <NoteForm
          submitting={addTicket.isPending}
          onCancel={(dirty) => (dirty ? setConfirmLeave(true) : navigate("/notes"))}
          onSubmit={(input) =>
            addTicket.mutate(input, {
              onSuccess: (created) => {
                toast.success("تم حفظ الملاحظة بنجاح", {
                  description: created
                    ? `سُجلت برقم ${formatId(created.id)} وهي الآن بانتظار التصديق.`
                    : "سُجلت الملاحظة وهي الآن بانتظار التصديق.",
                })
                navigate(created ? `/notes/${encodeURIComponent(created.id)}` : "/notes")
              },
            })
          }
        />
      </Panel>

      <AlertDialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تجاهل الملاحظة؟</AlertDialogTitle>
            <AlertDialogDescription className="leading-7">
              لم يتم حفظ البيانات التي أدخلتها. إذا غادرت الآن ستفقد النص والصور المرفقة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10">متابعة التحرير</AlertDialogCancel>
            <AlertDialogAction variant="danger" className="h-10" onClick={() => navigate("/notes")}>
              تجاهل والمغادرة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
