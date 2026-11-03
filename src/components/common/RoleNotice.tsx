import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/services/auth/AuthProvider"
import { PERMISSION_LABELS, ROLES, roleForPermission, type Permission } from "@/services/auth/roles"

/** Explains that the page’s main action needs a role the account does not have. */
export function RoleNotice({ permission, action }: { permission: Permission; action: string }) {
  const { can, user } = useAuth()
  if (can(permission)) return null
  const needed = ROLES[roleForPermission(permission)]
  const current = user ? user.roles.map((r) => ROLES[r].label).join(" · ") : "—"
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2.5 text-[13px] leading-6 text-foreground">
        <ShieldAlert className="mt-1 size-4 flex-none text-gold" aria-hidden />
        <span>
          حسابك يحمل أدوار «{current}». {action} يتطلب صلاحية «{PERMISSION_LABELS[permission]}» (دور «{needed.label}»).
          اطلب من المدير تعيين الدور المناسب لحسابك.
        </span>
      </p>
    </div>
  )
}
