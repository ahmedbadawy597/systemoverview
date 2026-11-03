import { Lock } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import { PERMISSION_LABELS, type Permission } from "@/services/auth/roles"

/** Shown when a user opens a route they are not allowed to use. */
export function PermissionEmpty({ permission, title }: { permission: Permission; title?: string }) {
  return (
    <EmptyState
      icon={Lock}
      title={title ?? "غير متاح لحسابك"}
      description={`هذه الصفحة تتطلب صلاحية «${PERMISSION_LABELS[permission]}». اطلب من المدير تعيين الدور المناسب.`}
    />
  )
}
