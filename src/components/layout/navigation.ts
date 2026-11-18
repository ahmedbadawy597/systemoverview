import {
  BadgeCheck,
  ClipboardList,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { Permission } from "@/services/auth/roles"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** Which ticket count to show beside the label. */
  count?: "pendingApproval" | "openDev"
  /** Hide from sidebar when the account lacks this permission. */
  permission?: Permission
}

export const MAIN_NAV: NavItem[] = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard, end: true, permission: "view" },
  { to: "/notes", label: "جميع الملاحظات", icon: ClipboardList, end: true, permission: "view" },
  { to: "/notes/new", label: "إضافة ملاحظة", icon: FilePlus2, permission: "create" },
  { to: "/approval", label: "التصديق", icon: BadgeCheck, count: "pendingApproval", permission: "approve" },
  { to: "/developer", label: "مراجعة المبرمجين", icon: Wrench, count: "openDev", permission: "devReview" },
  { to: "/reports", label: "التقارير", icon: FileText, permission: "print" },
]

export const USERS_NAV: NavItem = { to: "/users", label: "المستخدمون", icon: Users, permission: "manageUsers" }

export const SETTINGS_NAV: NavItem = { to: "/settings", label: "الإعدادات", icon: Settings, permission: "settings" }

export const PAGE_TITLES: Record<string, string> = {
  "/": "الرئيسية",
  "/notes": "جميع الملاحظات",
  "/notes/new": "إضافة ملاحظة",
  "/approval": "التصديق",
  "/developer": "مراجعة المبرمجين",
  "/reports": "التقارير",
  "/users": "إدارة المستخدمين",
  "/settings": "الإعدادات",
}
