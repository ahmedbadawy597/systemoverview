import { LogOut, ShieldCheck } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { Logo } from "@/components/brand/Logo"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { computeStats } from "@/domain/stats"
import { useTickets } from "@/hooks/useTickets"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuth } from "@/services/auth/AuthProvider"
import { ROLES } from "@/services/auth/roles"
import { MAIN_NAV, SETTINGS_NAV, type NavItem } from "./navigation"

interface SidebarProps {
  collapsed?: boolean
  /** Called after navigating, so the mobile sheet can close. */
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ collapsed = false, onNavigate, className }: SidebarProps) {
  const { data } = useTickets()
  const { role, signOut } = useAuth()
  const navigate = useNavigate()
  const stats = data ? computeStats(data) : null
  const counts = {
    pendingApproval: stats?.pending ?? 0,
    openDev: stats ? stats.total - stats.resolved : 0,
  }
  const roleDef = role ? ROLES[role] : null

  return (
    <aside
      aria-label="القائمة الرئيسية"
      className={cn("flex h-full flex-col bg-surface", collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]", className)}
    >
      <div className={cn("flex items-center gap-3 px-5 pt-5 pb-6", collapsed && "justify-center px-0")}>
        <Logo size={collapsed ? 48 : 56} />
        {!collapsed && (
          <div className="grid min-w-0 gap-0.5">
            <p className="truncate text-[15px] leading-snug font-bold text-brand">نظام إدارة الملاحظات</p>
            <p className="truncate text-xs text-muted-foreground">إدارة ومتابعة الملاحظات</p>
          </div>
        )}
      </div>

      <nav className={cn("flex-1 overflow-y-auto", collapsed ? "px-3" : "px-3.5")}>
        {!collapsed && <p className="px-3 pb-2 text-xs font-semibold text-muted-foreground">القائمة</p>}
        <ul className="grid gap-1">
          {MAIN_NAV.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} collapsed={collapsed} count={item.count ? counts[item.count] : undefined} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </nav>

      <div className={cn("grid gap-1 border-t border-line-soft pt-3 pb-4", collapsed ? "px-3" : "px-3.5")}>
        <SidebarLink item={SETTINGS_NAV} collapsed={collapsed} onNavigate={onNavigate} />

        {roleDef && (
          <div className={cn("mt-2 flex items-center gap-3 rounded-lg bg-surface-soft p-2.5", collapsed && "justify-center p-2")}>
            <span
              className="flex size-9 flex-none items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
              aria-hidden
            >
              {roleDef.label.charAt(0)}
            </span>
            {!collapsed && (
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="text-[11px] text-muted-foreground">الصلاحية الحالية</span>
                <span className="flex items-center gap-1 truncate text-[13px] font-bold text-foreground">
                  {role !== "staff" && <ShieldCheck className="size-3.5 text-gold" aria-hidden />}
                  {roleDef.label}
                </span>
              </div>
            )}
          </div>
        )}

        <SidebarButton
          collapsed={collapsed}
          label="تسجيل الخروج"
          icon={LogOut}
          onClick={() => {
            signOut()
            onNavigate?.()
            navigate("/", { replace: true })
          }}
        />
      </div>
    </aside>
  )
}

const itemBase =
  "group relative flex h-11 items-center gap-3 rounded-lg text-[14px] font-medium text-[#3d4945] transition-colors duration-150 hover:bg-surface-soft hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

function SidebarLink({
  item,
  collapsed,
  count,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  count?: number
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          itemBase,
          collapsed ? "justify-center" : "px-3",
          isActive &&
            "bg-surface-tint font-bold text-brand-dark hover:bg-surface-tint shadow-xs before:absolute before:inset-y-2.5 before:start-0 before:w-[3px] before:animate-[grow-y_320ms_var(--ease-out)_both] before:rounded-full before:bg-gold",
        )
      }
      aria-label={collapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn("size-[19px] flex-none transition-[color,transform] duration-200 ease-out group-hover:scale-110", isActive ? "text-brand" : "text-faint group-hover:text-brand")}
            strokeWidth={1.75}
            aria-hidden
          />
          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
          {!collapsed && count !== undefined && count > 0 && (
            <span
              className={cn(
                "tabular min-w-6 rounded-full px-1.5 text-center text-xs leading-5 font-bold",
                isActive ? "bg-brand text-white" : "bg-surface-soft text-foreground ring-1 ring-line",
              )}
              aria-label={`${formatNumber(count)} بانتظار الإجراء`}
            >
              {formatNumber(count)}
            </span>
          )}
          {collapsed && count !== undefined && count > 0 && (
            <span className="absolute top-2 end-3 size-2 rounded-full bg-gold" aria-hidden />
          )}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="left">
        {item.label}
        {count ? ` (${formatNumber(count)})` : ""}
      </TooltipContent>
    </Tooltip>
  )
}

function SidebarButton({
  collapsed,
  label,
  icon: Icon,
  onClick,
}: {
  collapsed: boolean
  label: string
  icon: NavItem["icon"]
  onClick: () => void
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      className={cn(itemBase, "w-full text-[#3d4945] hover:bg-[#fdf3f2] hover:text-danger", collapsed ? "justify-center" : "px-3")}
      aria-label={collapsed ? label : undefined}
    >
      <Icon className="size-[19px] flex-none text-faint group-hover:text-danger" strokeWidth={1.75} aria-hidden />
      {!collapsed && <span>{label}</span>}
    </button>
  )
  if (!collapsed) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  )
}
