export type Role = "staff" | "approver" | "developer" | "admin"
/** Alias used by the account-based auth model. */
export type SystemRole = Role
export type ProtectedRole = Exclude<Role, "staff">

export type Permission =
  | "view"
  | "create"
  | "approve"
  | "devReview"
  | "delete"
  | "print"
  | "settings"
  | "manageUsers"

export interface RoleDefinition {
  id: Role
  label: string
  description: string
  /** @deprecated Shared role passwords are replaced by user accounts. */
  requiresPassword: boolean
  permissions: Permission[]
}

export const ROLES: Record<Role, RoleDefinition> = {
  staff: {
    id: "staff",
    label: "موظف نظام",
    description: "عرض الملاحظات وإضافة ملاحظات جديدة ومشاركتها.",
    requiresPassword: false,
    permissions: ["view", "create"],
  },
  approver: {
    id: "approver",
    label: "تصديق",
    description: "تصديق الملاحظات وعرض التقارير وإصدارها.",
    requiresPassword: false,
    permissions: ["view", "create", "approve", "print"],
  },
  developer: {
    id: "developer",
    label: "مبرمجين",
    description: "تحديث حالة المراجعة الفنية وكتابة ملاحظات المبرمجين.",
    requiresPassword: false,
    permissions: ["view", "create", "devReview"],
  },
  admin: {
    id: "admin",
    label: "مدير",
    description: "كل الصلاحيات، بما فيها إدارة المستخدمين والتقارير والإعدادات.",
    requiresPassword: false,
    permissions: ["view", "create", "approve", "devReview", "delete", "print", "settings", "manageUsers"],
  },
}

export const ROLE_ORDER: Role[] = ["staff", "approver", "developer", "admin"]

/** Higher index = more privileged (for badge / primary role). */
const ROLE_RANK: Record<SystemRole, number> = {
  staff: 0,
  approver: 1,
  developer: 1,
  admin: 3,
}

export const PERMISSION_LABELS: Record<Permission, string> = {
  view: "عرض الملاحظات",
  create: "إضافة ملاحظة",
  approve: "تصديق الملاحظات",
  devReview: "مراجعة المبرمجين",
  delete: "حذف الملاحظات",
  print: "التقارير والطباعة",
  settings: "الإعدادات",
  manageUsers: "إدارة المستخدمين",
}

export function roleForPermission(permission: Permission): ProtectedRole {
  if (permission === "approve" || permission === "print") return "approver"
  if (permission === "devReview") return "developer"
  return "admin"
}

export function can(role: Role | null, permission: Permission) {
  return role ? ROLES[role].permissions.includes(permission) : false
}

export function permissionsForRoles(roles: SystemRole[]): Permission[] {
  const set = new Set<Permission>()
  for (const role of roles) {
    for (const p of ROLES[role].permissions) set.add(p)
  }
  return [...set]
}

export function canWithRoles(roles: SystemRole[] | null | undefined, permission: Permission) {
  if (!roles?.length) return false
  return permissionsForRoles(roles).includes(permission)
}

export function primarySystemRole(roles: SystemRole[]): SystemRole {
  if (!roles.length) return "staff"
  return [...roles].sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0]
}
