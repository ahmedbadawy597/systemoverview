import type { CreateUserInput, PublicUser, UpdateUserInput } from "@/domain/user"
import type { SystemRole } from "@/services/auth/roles"
import { apiRequest, ApiError } from "./http"
import { mapApiUser, type ApiUserPayload } from "./mapUser"

export type MutateResult<T = PublicUser> = { ok: true; user: T } | { ok: false; error: string }

function fail(error: unknown, fallback: string): MutateResult {
  if (error instanceof ApiError) return { ok: false, error: error.message || fallback }
  return { ok: false, error: fallback }
}

export async function listUsers(): Promise<PublicUser[]> {
  const data = await apiRequest<ApiUserPayload[]>("/users")
  return (data ?? []).map(mapApiUser).sort((a, b) => a.fullName.localeCompare(b.fullName, "ar"))
}

export async function createUser(input: CreateUserInput, _actorId?: string): Promise<MutateResult> {
  try {
    const data = await apiRequest<ApiUserPayload>("/users", {
      method: "POST",
      body: {
        username: input.username.trim().toLowerCase(),
        fullName: input.fullName.trim(),
        jobTitle: input.jobTitle,
        roles: input.roles,
        password: input.password,
        isActive: input.isActive ?? true,
      },
    })
    return { ok: true, user: mapApiUser(data) }
  } catch (error) {
    return fail(error, "تعذّر إنشاء المستخدم.")
  }
}

export async function updateUser(id: string, patch: UpdateUserInput): Promise<MutateResult> {
  try {
    if (patch.password) {
      await apiRequest("/auth/admin-reset-password", {
        method: "POST",
        body: { userId: id, newPassword: patch.password },
      })
    }

    const body: Record<string, unknown> = {}
    if (patch.fullName !== undefined) body.fullName = patch.fullName.trim()
    if (patch.jobTitle !== undefined) body.jobTitle = patch.jobTitle
    if (patch.isActive !== undefined) body.isActive = patch.isActive

    const data = Object.keys(body).length
      ? await apiRequest<ApiUserPayload>(`/users/${id}`, { method: "PATCH", body })
      : await apiRequest<ApiUserPayload>(`/users/${id}`)

    return { ok: true, user: mapApiUser(data) }
  } catch (error) {
    return fail(error, "تعذّر حفظ المستخدم.")
  }
}

export async function setUserRoles(id: string, roles: SystemRole[]): Promise<MutateResult> {
  try {
    const data = await apiRequest<ApiUserPayload>(`/users/${id}/roles`, {
      method: "PUT",
      body: { roles },
    })
    return { ok: true, user: mapApiUser(data) }
  } catch (error) {
    return fail(error, "تعذّر تحديث الأدوار.")
  }
}
