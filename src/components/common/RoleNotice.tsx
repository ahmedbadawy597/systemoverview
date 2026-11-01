import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/services/auth/AuthProvider"
import { ROLES, roleForPermission, type Permission } from "@/services/auth/roles"

/** Tells the user up front that this workspace's main action will ask for a password. */
export function RoleNotice({ permission, action }: { permission: Permission; action: string }) {
  const { can, role, ensure } = useAuth()
  if (can(permission)) return null
  const needed = ROLES[roleForPermission(permission)]
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2.5 text-[13px] leading-6 text-foreground">
        <KeyRound className="mt-1 size-4 flex-none text-gold" aria-hidden />
        <span>
          تتصفح حاليًا بصلاحية «{role ? ROLES[role].label : "—"}». {action} يتطلب صلاحية «{needed.label}» وسيُطلب منك كلمة المرور عند
          التنفيذ.
        </span>
      </p>
      <Button variant="outline" size="sm" className="flex-none" onClick={() => void ensure(permission)}>
        فتح صلاحية {needed.label}
      </Button>
    </div>
  )
}
