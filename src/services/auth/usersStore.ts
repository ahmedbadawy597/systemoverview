import type { AppUser, CreateUserInput, PublicUser, UpdateUserInput } from "@/domain/user"
import { toPublicUser } from "@/domain/user"
import type { SystemRole } from "./roles"
import { sha256Hex } from "./authService"

const USERS_KEY = "notes-system.users.v1"
const SESSION_KEY = "notes-system.session.v1"

function nowIso() {
  return new Date().toISOString()
}

function uid() {
  return `u_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

async function seedUsers(): Promise<AppUser[]> {
  const stamped = nowIso()
  const defs: Array<Omit<AppUser, "passwordHash"> & { password: string }> = [
    {
      id: "u_admin",
      username: "admin",
      fullName: "مدير النظام",
      jobTitle: "staff_member",
      roles: ["admin"],
      isActive: true,
      mustChangePassword: false,
      createdAt: stamped,
      createdBy: null,
      updatedAt: stamped,
      lastLoginAt: null,
      password: "Admin@2026",
    },
    {
      id: "u_approver",
      username: "approver",
      fullName: "مسؤول التصديق",
      jobTitle: "assistant",
      roles: ["approver"],
      isActive: true,
      mustChangePassword: false,
      createdAt: stamped,
      createdBy: "u_admin",
      updatedAt: stamped,
      lastLoginAt: null,
      password: "Approve@2026",
    },
    {
      id: "u_developer",
      username: "developer",
      fullName: "مراجع فني",
      jobTitle: "staff_member",
      roles: ["developer"],
      isActive: true,
      mustChangePassword: false,
      createdAt: stamped,
      createdBy: "u_admin",
      updatedAt: stamped,
      lastLoginAt: null,
      password: "Dev@2026",
    },
    {
      id: "u_staff",
      username: "staff",
      fullName: "موظف تسجيل",
      jobTitle: "staff_member",
      roles: ["staff"],
      isActive: true,
      mustChangePassword: false,
      createdAt: stamped,
      createdBy: "u_admin",
      updatedAt: stamped,
      lastLoginAt: null,
      password: "Staff@2026",
    },
    {
      id: "u_assistant",
      username: "assistant",
      fullName: "مساعد الوزير",
      jobTitle: "assistant",
      roles: ["approver", "developer"],
      isActive: true,
      mustChangePassword: false,
      createdAt: stamped,
      createdBy: "u_admin",
      updatedAt: stamped,
      lastLoginAt: null,
      password: "Assist@2026",
    },
  ]

  const users: AppUser[] = []
  for (const d of defs) {
    const { password, ...rest } = d
    users.push({ ...rest, passwordHash: await sha256Hex(password) })
  }
  return users
}

function readRaw(): AppUser[] | null {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppUser[]
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeRaw(users: AppUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

let memory: AppUser[] | null = null
let ready: Promise<void> | null = null

export async function ensureUsersStore(): Promise<void> {
  if (memory) return
  if (ready) return ready
  ready = (async () => {
    const existing = readRaw()
    if (existing?.length) {
      memory = existing
      return
    }
    memory = await seedUsers()
    writeRaw(memory)
  })()
  return ready
}

function requireStore(): AppUser[] {
  if (!memory) throw new Error("users store not initialized")
  return memory
}

function save(users: AppUser[]) {
  memory = users
  writeRaw(users)
}

export function getSessionUserId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function setSessionUserId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export async function listUsers(): Promise<PublicUser[]> {
  await ensureUsersStore()
  return requireStore()
    .slice()
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"))
    .map(toPublicUser)
}

export async function getUserById(id: string): Promise<AppUser | null> {
  await ensureUsersStore()
  return requireStore().find((u) => u.id === id) ?? null
}

export async function getPublicUserById(id: string): Promise<PublicUser | null> {
  const user = await getUserById(id)
  return user ? toPublicUser(user) : null
}

export type LoginResult =
  | { ok: true; user: PublicUser }
  | { ok: false; reason: "invalid" | "inactive" }

export async function loginWithPassword(username: string, password: string): Promise<LoginResult> {
  await ensureUsersStore()
  const normalized = username.trim().toLowerCase()
  const user = requireStore().find((u) => u.username.toLowerCase() === normalized)
  if (!user) return { ok: false, reason: "invalid" }
  if (!user.isActive) return { ok: false, reason: "inactive" }
  const hash = await sha256Hex(password)
  if (hash !== user.passwordHash) return { ok: false, reason: "invalid" }

  const stamped = nowIso()
  save(requireStore().map((u) => (u.id === user.id ? { ...u, lastLoginAt: stamped, updatedAt: stamped } : u)))
  setSessionUserId(user.id)
  const fresh = await getUserById(user.id)
  return { ok: true, user: toPublicUser(fresh!) }
}

export async function logoutSession() {
  setSessionUserId(null)
}

export type MutateResult<T = PublicUser> = { ok: true; user: T } | { ok: false; error: string }

export async function createUser(input: CreateUserInput, actorId: string): Promise<MutateResult> {
  await ensureUsersStore()
  const username = input.username.trim().toLowerCase()
  if (!username) return { ok: false, error: "اسم المستخدم مطلوب." }
  if (!input.fullName.trim()) return { ok: false, error: "الاسم الكامل مطلوب." }
  if (!input.roles.length) return { ok: false, error: "يجب اختيار صلاحية نظام واحدة على الأقل." }
  if (input.password.length < 6) return { ok: false, error: "كلمة المرور يجب ألا تقل عن ٦ أحرف." }
  if (requireStore().some((u) => u.username.toLowerCase() === username)) {
    return { ok: false, error: "اسم المستخدم مستخدم مسبقًا." }
  }

  const stamped = nowIso()
  const user: AppUser = {
    id: uid(),
    username,
    fullName: input.fullName.trim(),
    jobTitle: input.jobTitle,
    roles: [...new Set(input.roles)],
    isActive: input.isActive ?? true,
    passwordHash: await sha256Hex(input.password),
    mustChangePassword: true,
    createdAt: stamped,
    createdBy: actorId,
    updatedAt: stamped,
    lastLoginAt: null,
  }
  save([...requireStore(), user])
  return { ok: true, user: toPublicUser(user) }
}

export async function updateUser(id: string, patch: UpdateUserInput): Promise<MutateResult> {
  await ensureUsersStore()
  const current = requireStore().find((u) => u.id === id)
  if (!current) return { ok: false, error: "المستخدم غير موجود." }

  const next: AppUser = {
    ...current,
    fullName: patch.fullName?.trim() || current.fullName,
    jobTitle: patch.jobTitle ?? current.jobTitle,
    isActive: patch.isActive ?? current.isActive,
    mustChangePassword: patch.mustChangePassword ?? current.mustChangePassword,
    updatedAt: nowIso(),
  }
  if (patch.password) {
    if (patch.password.length < 6) return { ok: false, error: "كلمة المرور يجب ألا تقل عن ٦ أحرف." }
    next.passwordHash = await sha256Hex(patch.password)
    next.mustChangePassword = patch.mustChangePassword ?? true
  }
  save(requireStore().map((u) => (u.id === id ? next : u)))
  return { ok: true, user: toPublicUser(next) }
}

export async function setUserRoles(id: string, roles: SystemRole[]): Promise<MutateResult> {
  await ensureUsersStore()
  const unique = [...new Set(roles)]
  if (!unique.length) return { ok: false, error: "يجب الإبقاء على صلاحية واحدة على الأقل." }

  const users = requireStore()
  const current = users.find((u) => u.id === id)
  if (!current) return { ok: false, error: "المستخدم غير موجود." }

  const wasAdmin = current.roles.includes("admin")
  const willBeAdmin = unique.includes("admin")
  if (wasAdmin && !willBeAdmin) {
    const otherAdmins = users.filter((u) => u.id !== id && u.isActive && u.roles.includes("admin"))
    if (otherAdmins.length === 0) {
      return { ok: false, error: "لا يمكن إزالة صلاحية المدير من آخر مدير نشط." }
    }
  }

  const next = { ...current, roles: unique, updatedAt: nowIso() }
  save(users.map((u) => (u.id === id ? next : u)))
  return { ok: true, user: toPublicUser(next) }
}

export async function countActiveAdmins() {
  await ensureUsersStore()
  return requireStore().filter((u) => u.isActive && u.roles.includes("admin")).length
}
