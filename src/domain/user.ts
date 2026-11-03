import {
  permissionsForRoles,
  primarySystemRole,
  ROLES,
  type Permission,
  type SystemRole,
} from "@/services/auth/roles"

/** Job title in the ministry — identity only, not permissions. */
export type JobTitle = "minister" | "assistant" | "staff_member"

export const JOB_TITLES: Record<JobTitle, { label: string; description: string }> = {
  minister: { label: "وزير", description: "منصب معالي وزير الأوقاف" },
  assistant: { label: "مساعد", description: "مساعد الوزير أو جهة مساعدة" },
  staff_member: { label: "موظف", description: "موظف في الوزارة" },
}

export const JOB_TITLE_ORDER: JobTitle[] = ["minister", "assistant", "staff_member"]

export interface AppUser {
  id: string
  username: string
  fullName: string
  jobTitle: JobTitle
  roles: SystemRole[]
  isActive: boolean
  /** SHA-256 hex — never show in UI lists beyond admin tooling. */
  passwordHash: string
  mustChangePassword: boolean
  createdAt: string
  createdBy: string | null
  updatedAt: string
  lastLoginAt: string | null
}

/** Safe user object for session/UI (no password hash). */
export interface PublicUser {
  id: string
  username: string
  fullName: string
  jobTitle: JobTitle
  roles: SystemRole[]
  isActive: boolean
  mustChangePassword: boolean
  createdAt: string
  lastLoginAt: string | null
  permissions: Permission[]
  /** Highest system role for compact badges. */
  primaryRole: SystemRole
}

export function toPublicUser(user: AppUser): PublicUser {
  const roles = user.roles.length ? user.roles : (["staff"] as SystemRole[])
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    jobTitle: user.jobTitle,
    roles,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    permissions: permissionsForRoles(roles),
    primaryRole: primarySystemRole(roles),
  }
}

export function roleLabels(roles: SystemRole[]) {
  return roles.map((r) => ROLES[r].label).join(" · ")
}

export interface CreateUserInput {
  username: string
  fullName: string
  jobTitle: JobTitle
  roles: SystemRole[]
  password: string
  isActive?: boolean
}

export interface UpdateUserInput {
  fullName?: string
  jobTitle?: JobTitle
  isActive?: boolean
  password?: string
  mustChangePassword?: boolean
}
