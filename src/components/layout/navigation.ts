import {
  BadgeCheck,
  ClipboardList,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Settings,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { Permission } from "@/services/auth/roles"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** Which queue count to show beside the label. */
  count?: "pendingApproval" | "openDev"
  permission?: Permission
}

export const MAIN_NAV: NavItem[] = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard, end: true },
  { to: "/notes", label: "جميع الملاحظات", icon: ClipboardList, end: true },
  { to: "/notes/new", label: "إضافة ملاحظة", icon: FilePlus2 },
  { to: "/approval", label: "التصديق", icon: BadgeCheck, count: "pendingApproval" },
  { to: "/developer", label: "مراجعة المبرمجين", icon: Wrench, count: "openDev" },
  { to: "/reports", label: "التقارير", icon: FileText },
]

export const SETTINGS_NAV: NavItem = { to: "/settings", label: "الإعدادات", icon: Settings, permission: "settings" }

export const PAGE_TITLES: Record<string, string> = {
  "/": "الرئيسية",
  "/notes": "جميع الملاحظات",
  "/notes/new": "إضافة ملاحظة",
  "/approval": "التصديق",
  "/developer": "مراجعة المبرمجين",
  "/reports": "التقارير",
  "/settings": "الإعدادات",
}
