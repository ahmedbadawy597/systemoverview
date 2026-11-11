import { ChevronDown, LayoutGrid, LogOut, Settings, ShieldCheck, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { JOB_TITLES, roleLabels } from "@/domain/user"
import { useAuth } from "@/services/auth/AuthProvider"
import { ROLES } from "@/services/auth/roles"

export function RoleBadge() {
  const { user } = useAuth()
  if (!user) return null
  const elevated = user.primaryRole !== "staff"
  return (
    <span
      className={
        elevated
          ? "hidden h-8 items-center gap-1.5 rounded-full bg-[#f6f0de] px-3 text-xs font-bold text-[#5e4a12] sm:inline-flex"
          : "hidden h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-xs font-bold text-muted-foreground ring-1 ring-line sm:inline-flex"
      }
    >
      {elevated && <ShieldCheck className="size-3.5" aria-hidden />}
      {roleLabels(user.roles)}
    </span>
  )
}

export function UserMenu() {
  const { user, signOut, can, canViewApps } = useAuth()
  const navigate = useNavigate()
  if (!user) return null

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger
        className="flex h-10 items-center gap-2 rounded-full ps-1 pe-2 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`قائمة المستخدم، ${user.fullName}`}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white">
          {user.fullName.charAt(0)}
        </span>
        <ChevronDown className="size-4 text-faint" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-1.5">
        <DropdownMenuLabel className="grid gap-0.5 px-2 py-2">
          <span className="text-[13px] font-bold text-foreground">{user.fullName}</span>
          <span className="text-xs font-normal text-muted-foreground">
            @{user.username} · {JOB_TITLES[user.jobTitle].label}
          </span>
          <span className="pt-1 text-xs leading-5 font-normal text-muted-foreground">
            أدوار النظام: {roleLabels(user.roles)}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canViewApps && (
          <DropdownMenuItem onSelect={() => navigate("/apps")} className="h-9">
            <LayoutGrid />
            التطبيقات
          </DropdownMenuItem>
        )}
        {can("manageUsers") && (
          <DropdownMenuItem onSelect={() => navigate("/users")} className="h-9">
            <Users />
            إدارة المستخدمين
          </DropdownMenuItem>
        )}
        {can("settings") && (
          <DropdownMenuItem onSelect={() => navigate("/settings")} className="h-9">
            <Settings />
            الإعدادات
          </DropdownMenuItem>
        )}
        {(canViewApps || can("manageUsers") || can("settings")) && <DropdownMenuSeparator />}
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
        <p className="px-2 pt-1 pb-1.5 text-[11px] leading-5 text-muted-foreground">
          الصلاحية الأساسية: {ROLES[user.primaryRole].label}. لتغيير الأدوار اطلب من المدير.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
