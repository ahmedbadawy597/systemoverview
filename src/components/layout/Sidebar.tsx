import { type ReactNode } from "react"
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { Logo } from "@/components/brand/Logo"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { JOB_TITLES, roleLabels } from "@/domain/user"
import { useTicketStats } from "@/hooks/useTickets"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuth } from "@/services/auth/AuthProvider"
import { MAIN_NAV, SETTINGS_NAV, USERS_NAV, type NavItem } from "./navigation"

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapsed?: () => void
  /** Called after navigating, so the mobile sheet can close. */
  onNavigate?: () => void
  className?: string
}

export function Sidebar({ collapsed = false, onToggleCollapsed, onNavigate, className }: SidebarProps) {
  const { data: stats } = useTicketStats()
  const { user, signOut, can } = useAuth()
  const navigate = useNavigate()
  const counts = {
    pendingApproval: stats?.pending ?? 0,
    openDev: stats ? stats.notReviewed + stats.underStudy : 0,
  }

  const mainItems = MAIN_NAV.filter((item) => !item.permission || can(item.permission))
  const adminItems = [can("manageUsers") ? USERS_NAV : null, can("settings") ? SETTINGS_NAV : null].filter(
    Boolean,
  ) as NavItem[]

  return (
    <aside
      aria-label="القائمة الرئيسية"
      className={cn(
        "relative flex h-full flex-col",
        collapsed ? "w-[var(--sidebar-collapsed)] bg-[#f6f8f7]" : "w-[var(--sidebar-width)] bg-surface",
        className,
      )}
    >
      {/* Top: toggle (+ brand when expanded) */}
      <div
        className={cn(
          "flex shrink-0 flex-col",
          collapsed ? "items-center gap-3 px-2 pt-4 pb-3" : "gap-4 px-4 pt-5 pb-4",
        )}
      >
        {onToggleCollapsed && (
          <RailIconButton
            collapsed={collapsed}
            label={collapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
            onClick={onToggleCollapsed}
            bordered
            className="text-brand"
          >
            {collapsed ? <ChevronLeft className="size-[18px]" strokeWidth={2} /> : <ChevronRight className="size-[18px]" strokeWidth={2} />}
          </RailIconButton>
        )}

        {collapsed ? (
          <div className="h-px w-8 bg-[#d7dedb]" aria-hidden />
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative flex size-14 items-center justify-center rounded-xl bg-white p-1.5 shadow-card ring-1 ring-line-soft">
              <Logo size={44} />
            </div>
            <div className="grid min-w-0 flex-1 gap-0.5">
              <p className="font-heading truncate text-[16px] leading-snug font-bold text-brand">نظام إدارة الملاحظات</p>
              <p className="truncate text-[11.5px] leading-relaxed text-muted-foreground">وزارة الأوقاف المصرية</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto",
          collapsed ? "items-center gap-2 px-2 py-1" : "gap-5 px-3 py-2",
        )}
      >
        <NavSection label="التشغيل" collapsed={collapsed}>
          {mainItems.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              collapsed={collapsed}
              count={item.count ? counts[item.count] : undefined}
              onNavigate={onNavigate}
            />
          ))}
        </NavSection>

        {adminItems.length > 0 && (
          <>
            {collapsed && <div className="my-1 h-px w-8 bg-[#d7dedb]" aria-hidden />}
            <NavSection label="الإدارة" collapsed={collapsed}>
              {adminItems.map((item) => (
                <SidebarLink key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
              ))}
            </NavSection>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={cn("mt-auto shrink-0", collapsed ? "flex flex-col items-center gap-2 px-2 pt-2 pb-4" : "px-3 pt-2 pb-4")}>
        <div className={cn("bg-[#d7dedb]", collapsed ? "mb-1 h-px w-8" : "mb-3 h-px w-full")} aria-hidden />

        {user && !collapsed && (
          <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-surface-soft/80 px-2.5 py-2 ring-1 ring-line-soft">
            <span className="flex size-9 flex-none items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white" aria-hidden>
              {user.fullName.charAt(0)}
            </span>
            <div className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate text-[13px] font-bold text-foreground">{user.fullName}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {JOB_TITLES[user.jobTitle].label}
                {user.roles.length ? ` · ${roleLabels(user.roles)}` : ""}
              </span>
            </div>
          </div>
        )}

        {user && collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="flex size-10 items-center justify-center rounded-[12px] bg-brand text-[13px] font-bold text-white"
                aria-label={`${user.fullName} — ${JOB_TITLES[user.jobTitle].label}`}
              >
                {user.fullName.charAt(0)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={12} className="max-w-[220px]">
              <p className="font-semibold">{user.fullName}</p>
              <p className="text-[11px] opacity-80">
                {JOB_TITLES[user.jobTitle].label}
                {user.roles.length ? ` · ${roleLabels(user.roles)}` : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        <SidebarButton
          collapsed={collapsed}
          label="تسجيل الخروج"
          icon={LogOut}
          bordered={collapsed}
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

function NavSection({
  label,
  collapsed,
  children,
}: {
  label: string
  collapsed: boolean
  children: ReactNode
}) {
  return (
    <div className={cn("grid", collapsed ? "justify-items-center gap-2" : "gap-1")}>
      {!collapsed && <p className="px-2.5 pb-1 text-[11.5px] font-bold text-muted-foreground">{label}</p>}
      <ul className={cn("grid", collapsed ? "justify-items-center gap-2" : "gap-0.5")}>{children}</ul>
    </div>
  )
}

function RailIconButton({
  collapsed,
  label,
  onClick,
  children,
  bordered,
  danger,
  className,
}: {
  collapsed: boolean
  label: string
  onClick: () => void
  children: ReactNode
  bordered?: boolean
  danger?: boolean
  className?: string
}) {
  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group flex size-10 items-center justify-center rounded-[12px] transition-[background-color,border-color,color,box-shadow] duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        bordered
          ? "border border-[#c5d0cb] bg-transparent text-brand hover:border-brand hover:bg-white"
          : "text-brand hover:bg-white/80",
        danger && "border-[#e2c4c0] text-[#8f2f2f] hover:border-danger hover:bg-[#fdf3f2] hover:text-danger",
        !collapsed && "w-full justify-start gap-2.5 px-2.5",
        className,
      )}
    >
      {children}
    </button>
  )

  if (!collapsed) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="left" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

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
          "group relative flex items-center outline-none transition-[background-color,border-color,color,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring/40",
          collapsed
            ? "size-10 justify-center rounded-[12px]"
            : "h-10 gap-2.5 rounded-xl px-2.5 text-[13.5px] font-medium",
          collapsed && !isActive && "text-brand hover:bg-white/80",
          collapsed && isActive && "border border-[#c5d0cb] bg-white text-brand shadow-xs",
          !collapsed && !isActive && "text-[#3d4945] hover:bg-surface-soft hover:text-foreground",
          !collapsed &&
            isActive &&
            "bg-surface-tint font-bold text-brand-dark shadow-xs before:absolute before:inset-y-2 before:start-0 before:w-[3px] before:rounded-full before:bg-gold",
        )
      }
      aria-label={collapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "flex-none transition-[color,transform] duration-200 ease-out",
              collapsed ? "size-[18px]" : "size-[18px]",
              collapsed
                ? "text-brand"
                : isActive
                  ? "text-brand"
                  : "text-faint group-hover:scale-105 group-hover:text-brand",
            )}
            strokeWidth={1.75}
            aria-hidden
          />
          {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
          {!collapsed && count !== undefined && count > 0 && (
            <span
              className={cn(
                "tabular min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-bold",
                isActive ? "bg-brand text-white" : "bg-white text-foreground ring-1 ring-line",
              )}
              aria-label={`${formatNumber(count)} بانتظار الإجراء`}
            >
              {formatNumber(count)}
            </span>
          )}
          {collapsed && count !== undefined && count > 0 && (
            <span className="absolute top-1 end-1 size-1.5 rounded-full bg-gold ring-2 ring-[#f6f8f7]" aria-hidden />
          )}
        </>
      )}
    </NavLink>
  )

  if (!collapsed) return <li>{link}</li>
  return (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="left" sideOffset={12}>
          <span className="flex items-center gap-2">
            {item.label}
            {count ? (
              <span className="tabular rounded-full bg-white/15 px-1.5 text-[11px] font-bold">{formatNumber(count)}</span>
            ) : null}
          </span>
        </TooltipContent>
      </Tooltip>
    </li>
  )
}

function SidebarButton({
  collapsed,
  label,
  icon: Icon,
  onClick,
  bordered,
}: {
  collapsed: boolean
  label: string
  icon: NavItem["icon"]
  onClick: () => void
  bordered?: boolean
}) {
  if (collapsed) {
    return (
      <RailIconButton collapsed label={label} onClick={onClick} bordered={bordered} danger>
        <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
      </RailIconButton>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-10 w-full items-center gap-2.5 rounded-xl px-2.5 text-[13.5px] font-medium text-[#3d4945] transition-colors hover:bg-[#fdf3f2] hover:text-danger focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Icon className="size-[18px] flex-none text-faint transition-colors group-hover:text-danger" strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
    </button>
  )
}
