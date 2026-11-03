import type { JobTitle, PublicUser } from "@/domain/user"
import { permissionsForRoles, primarySystemRole, type Permission, type SystemRole } from "@/services/auth/roles"

const JOB_TITLES: JobTitle[] = ["minister", "assistant", "staff_member"]
const SYSTEM_ROLES: SystemRole[] = ["staff", "approver", "developer", "admin"]
const KNOWN_PERMISSIONS: Permission[] = [
  "view",
  "create",
  "approve",
  "devReview",
  "delete",
  "print",
  "settings",
  "manageUsers",
]

export interface ApiUserPayload {
  id: string
  username: string
  fullName: string
  jobTitle?: string
  roles?: string[]
  permissions?: string[]
  isActive?: boolean
  mustChangePassword?: boolean
  createdAt?: string
  lastLoginAt?: string | null
  email?: string | null
}

function asJobTitle(value: unknown): JobTitle {
  return JOB_TITLES.includes(value as JobTitle) ? (value as JobTitle) : "staff_member"
}

function asRoles(value: unknown): SystemRole[] {
  if (!Array.isArray(value)) return []
  return value.filter((r): r is SystemRole => SYSTEM_ROLES.includes(r as SystemRole))
}

function asPermissions(value: unknown): Permission[] {
  if (!Array.isArray(value)) return []
  return value.filter((p): p is Permission => KNOWN_PERMISSIONS.includes(p as Permission))
}

export function mapApiUser(raw: ApiUserPayload): PublicUser {
  const roles = asRoles(raw.roles)
  const fromApi = asPermissions(raw.permissions)
  const fromRoles = permissionsForRoles(roles)
  const permissions = [...new Set([...fromApi, ...fromRoles])]
  if (permissions.includes("manageUsers") && !permissions.includes("settings")) {
    permissions.push("settings")
  }

  return {
    id: raw.id,
    username: raw.username,
    fullName: raw.fullName,
    jobTitle: asJobTitle(raw.jobTitle),
    roles,
    isActive: raw.isActive !== false,
    mustChangePassword: Boolean(raw.mustChangePassword),
    createdAt: raw.createdAt ?? "",
    lastLoginAt: raw.lastLoginAt ?? null,
    permissions,
    primaryRole: roles.length ? primarySystemRole(roles) : "staff",
  }
}
