export type Role = "staff" | "approver" | "developer" | "admin"
export type ProtectedRole = Exclude<Role, "staff">

export type Permission = "view" | "create" | "approve" | "devReview" | "delete" | "print" | "settings"

export interface RoleDefinition {
  id: Role
  label: string
  description: string
  requiresPassword: boolean
  permissions: Permission[]
}

export const ROLES: Record<Role, RoleDefinition> = {
  staff: {
    id: "staff",
    label: "موظف",
    description: "عرض الملاحظات وإضافة ملاحظات جديدة ومشاركتها.",
    requiresPassword: false,
    permissions: ["view", "create"],
  },
  approver: {
    id: "approver",
    label: "تصديق",
    description: "تصديق الملاحظات المسجلة بعد مراجعتها.",
    requiresPassword: true,
    permissions: ["view", "create", "approve"],
  },
  developer: {
    id: "developer",
    label: "مبرمجين",
    description: "تحديث حالة المراجعة الفنية وكتابة ملاحظات المبرمجين.",
    requiresPassword: true,
    permissions: ["view", "create", "devReview"],
  },
  admin: {
    id: "admin",
    label: "مدير",
    description: "الإعدادات وحذف الملاحظات وطباعة التقارير، إضافة إلى التصديق والمراجعة.",
    requiresPassword: true,
    permissions: ["view", "create", "approve", "devReview", "delete", "print", "settings"],
  },
}

export const ROLE_ORDER: Role[] = ["staff", "approver", "developer", "admin"]

export const PERMISSION_LABELS: Record<Permission, string> = {
  view: "عرض الملاحظات",
  create: "إضافة ملاحظة",
  approve: "تصديق الملاحظات",
  devReview: "مراجعة المبرمجين",
  delete: "حذف الملاحظات",
  print: "طباعة التقارير",
  settings: "الإعدادات",
}

/** The least-privileged role that grants a permission; used to ask for the right password. */
export function roleForPermission(permission: Permission): ProtectedRole {
  if (permission === "approve") return "approver"
  if (permission === "devReview") return "developer"
  return "admin"
}

export function can(role: Role | null, permission: Permission) {
  return role ? ROLES[role].permissions.includes(permission) : false
}
