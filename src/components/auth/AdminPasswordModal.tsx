import type { ReactNode } from "react"
import { RolePasswordModal } from "./RolePasswordModal"

interface AdminPasswordModalProps {
  open: boolean
  title?: string
  description?: ReactNode
  confirmLabel?: string
  children?: ReactNode
  onVerified: () => void
  onCancel: () => void
}

/** Always asks for the admin password, even when the session already holds the admin role. */
export function AdminPasswordModal(props: AdminPasswordModalProps) {
  return (
    <RolePasswordModal
      {...props}
      role="admin"
      title={props.title ?? "تأكيد صلاحية المدير"}
      description={props.description ?? "أدخل كلمة مرور المدير لإتمام هذا الإجراء."}
      confirmLabel={props.confirmLabel ?? "تأكيد"}
    />
  )
}
