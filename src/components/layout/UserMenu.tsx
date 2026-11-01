import { Check, ChevronDown, LogOut, Settings, ShieldCheck } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/services/auth/AuthProvider"
import { ROLES, type ProtectedRole } from "@/services/auth/roles"
import { toast } from "sonner"

const SWITCHABLE: ProtectedRole[] = ["approver", "developer", "admin"]

export function RoleBadge() {
  const { role } = useAuth()
  if (!role) return null
  const elevated = role !== "staff"
  return (
    <span
      className={
        elevated
          ? "hidden h-8 items-center gap-1.5 rounded-full bg-[#f6f0de] px-3 text-xs font-bold text-[#5e4a12] sm:inline-flex"
          : "hidden h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-bold text-muted-foreground ring-1 ring-line sm:inline-flex"
      }
    >
      {elevated && <ShieldCheck className="size-3.5" aria-hidden />}
      صلاحية: {ROLES[role].label}
    </span>
  )
}

export function UserMenu() {
  const { role, signIn, signOut, elevate } = useAuth()
  const navigate = useNavigate()
  if (!role) return null
  const def = ROLES[role]

  async function switchTo(target: ProtectedRole) {
    if (target === role) return
    const ok = await elevate(target)
    if (ok) toast.success(`تم التبديل إلى صلاحية «${ROLES[target].label}»`)
  }

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger
        className="flex h-10 items-center gap-2 rounded-full ps-1 pe-2 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`قائمة المستخدم، الصلاحية الحالية ${def.label}`}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
          {def.label.charAt(0)}
        </span>
        <ChevronDown className="size-4 text-faint" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5">
        <DropdownMenuLabel className="grid gap-0.5 px-2 py-2">
          <span className="text-[13px] font-bold text-foreground">صلاحية {def.label}</span>
          <span className="text-xs leading-5 font-normal text-muted-foreground">{def.description}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 pt-1.5 pb-1 text-xs font-semibold text-muted-foreground">تبديل الصلاحية</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => signIn("staff")} className="h-9">
            <span className="flex-1">{ROLES.staff.label}</span>
            {role === "staff" && <Check className="text-brand-btn" />}
          </DropdownMenuItem>
          {SWITCHABLE.map((r) => (
            <DropdownMenuItem key={r} onSelect={() => void switchTo(r)} className="h-9">
              <span className="flex-1">{ROLES[r].label}</span>
              {role === r ? <Check className="text-brand-btn" /> : <span className="text-[11px] text-muted-foreground">بكلمة مرور</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/settings")} className="h-9">
          <Settings />
          الإعدادات
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          className="h-9"
          onSelect={() => {
            signOut()
            navigate("/", { replace: true })
          }}
        >
          <LogOut />
          تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
