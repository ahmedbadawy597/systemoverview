import type {
  AppColor,
  AppIcon,
  AppInterface,
  AppInterfaceDraft,
  AppPublishStatus,
  AppStatusLabel,
  CreateAppInput,
  UpdateAppInput,
  WorkspaceApp,
  WorkspaceAppsSummary,
} from "@/domain/app"
import { apiRequest, apiRequestWithMeta, ApiError, type DuplicateAppRef } from "./http"

export type AppStatusFilter = AppPublishStatus | "all"

export interface AppListQuery {
  page?: number
  limit?: number
  q?: string
  status?: AppStatusFilter
}

export interface AppPage {
  items: WorkspaceApp[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AppMutateResult =
  | { ok: true; app: WorkspaceApp }
  | { ok: false; error: string; code?: string; existing?: DuplicateAppRef }

export type DuplicateCheckResult = {
  id: string
  name: string
  url: string
  publishStatus?: string
  matchedBy: "name" | "url"
}

function toQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    search.set(key, String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ""
}

function mapApp(raw: Partial<WorkspaceApp>): WorkspaceApp {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: raw.description ?? null,
    url: String(raw.url ?? ""),
    color: (raw.color as AppColor) ?? "blue",
    icon: (raw.icon as AppIcon) ?? "grid",
    statusLabel: (raw.statusLabel as AppStatusLabel) ?? "يعمل",
    usersCount: Number(raw.usersCount ?? 0),
    operationalReadinessPercent: Number(raw.operationalReadinessPercent ?? 0),
    isFeatured: Boolean(raw.isFeatured),
    publishedAt: raw.publishedAt ?? null,
    publishStatus: (raw.publishStatus as AppPublishStatus) ?? "draft",
    sortOrder: Number(raw.sortOrder ?? 0),
    createdBy: String(raw.createdBy ?? ""),
    updatedBy: raw.updatedBy ?? null,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  }
}

function fail(error: unknown, fallback: string): AppMutateResult {
  if (error instanceof ApiError) {
    return {
      ok: false,
      error: error.message || fallback,
      code: error.code,
      existing: error.existing,
    }
  }
  return { ok: false, error: fallback }
}

function mapInterface(raw: Partial<AppInterface>): AppInterface {
  return {
    id: String(raw.id ?? ""),
    appId: String(raw.appId ?? ""),
    label: String(raw.label ?? ""),
    url: raw.url ?? null,
    username: raw.username ?? null,
    password: raw.password ?? null,
    hasPassword: Boolean(raw.hasPassword),
    sortOrder: Number(raw.sortOrder ?? 0),
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  }
}

function mapWorkspaceSummary(raw: Partial<WorkspaceAppsSummary> | null | undefined): WorkspaceAppsSummary {
  const totalApps = Number(raw?.totalApps ?? 0)
  const totalInterfaces = Number(raw?.totalInterfaces ?? 0)
  const alertsCount = Number(raw?.alertsCount ?? 0)
  return {
    totalApps,
    totalInterfaces,
    avgOperationalReadinessPercent: Number(raw?.avgOperationalReadinessPercent ?? 0),
    avgInterfacesPerApp:
      raw?.avgInterfacesPerApp !== undefined
        ? Number(raw.avgInterfacesPerApp)
        : totalApps === 0
          ? 0
          : Math.round((totalInterfaces / totalApps) * 10) / 10,
    alertsCount,
    alertsLabel: String(raw?.alertsLabel ?? (alertsCount === 0 ? "لا يوجد أعطال حالياً" : "تطبيقات تحتاج متابعة")),
    systemsHealthy: raw?.systemsHealthy !== undefined ? Boolean(raw.systemsHealthy) : alertsCount === 0,
  }
}

export const appsApi = {
  async list(query: AppListQuery = {}): Promise<AppPage> {
    const page = query.page ?? 1
    const limit = query.limit ?? 50
    const { data, meta } = await apiRequestWithMeta<Partial<WorkspaceApp>[]>(
      `/apps${toQuery({
        page,
        limit,
        q: query.q?.trim() || undefined,
        status: query.status ?? "all",
      })}`,
    )
    const items = (Array.isArray(data) ? data : []).map(mapApp)
    return {
      items,
      page: meta?.page ?? page,
      limit: meta?.limit ?? limit,
      total: meta?.total ?? items.length,
      totalPages: meta?.totalPages ?? Math.max(1, Math.ceil((meta?.total ?? items.length) / limit) || 1),
    }
  },

  async get(id: string): Promise<WorkspaceApp> {
    const data = await apiRequest<Partial<WorkspaceApp>>(`/apps/${id}`)
    return mapApp(data ?? {})
  },

  async create(input: CreateAppInput): Promise<AppMutateResult> {
    try {
      const data = await apiRequest<Partial<WorkspaceApp>>("/apps", {
        method: "POST",
        body: {
          name: input.name.trim(),
          description: input.description?.trim() || undefined,
          url: input.url.trim(),
          color: input.color,
          icon: input.icon,
          statusLabel: input.statusLabel,
          usersCount: input.usersCount,
          operationalReadinessPercent: input.operationalReadinessPercent ?? 0,
          isFeatured: input.isFeatured ?? false,
          sortOrder: input.sortOrder ?? 0,
          publishNow: input.publishNow ?? false,
        },
      })
      return { ok: true, app: mapApp(data ?? {}) }
    } catch (error) {
      return fail(error, "تعذّر إنشاء التطبيق.")
    }
  },

  async update(id: string, input: UpdateAppInput): Promise<AppMutateResult> {
    try {
      const data = await apiRequest<Partial<WorkspaceApp>>(`/apps/${id}`, {
        method: "PATCH",
        body: {
          name: input.name.trim(),
          description: input.description?.trim() || undefined,
          url: input.url.trim(),
          color: input.color,
          icon: input.icon,
          statusLabel: input.statusLabel,
          usersCount: input.usersCount,
          operationalReadinessPercent: input.operationalReadinessPercent ?? 0,
          isFeatured: input.isFeatured ?? false,
          sortOrder: input.sortOrder ?? 0,
        },
      })
      return { ok: true, app: mapApp(data ?? {}) }
    } catch (error) {
      return fail(error, "تعذّر حفظ التطبيق.")
    }
  },

  async publish(id: string): Promise<AppMutateResult> {
    try {
      const data = await apiRequest<Partial<WorkspaceApp>>(`/apps/${id}/publish`, { method: "POST", body: {} })
      return { ok: true, app: mapApp(data ?? {}) }
    } catch (error) {
      return fail(error, "تعذّر نشر التطبيق.")
    }
  },

  async unpublish(id: string): Promise<AppMutateResult> {
    try {
      const data = await apiRequest<Partial<WorkspaceApp>>(`/apps/${id}/unpublish`, { method: "POST", body: {} })
      return { ok: true, app: mapApp(data ?? {}) }
    } catch (error) {
      return fail(error, "تعذّر إلغاء نشر التطبيق.")
    }
  },

  async remove(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      await apiRequest(`/apps/${id}`, { method: "DELETE" })
      return { ok: true }
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, error: error.message || "تعذّر حذف التطبيق." }
      return { ok: false, error: "تعذّر حذف التطبيق." }
    }
  },

  async workspaceSummary(): Promise<WorkspaceAppsSummary> {
    const data = await apiRequest<Partial<WorkspaceAppsSummary>>("/apps/workspace-summary")
    return mapWorkspaceSummary(data)
  },

  async checkDuplicate(input: {
    name?: string
    url?: string
    excludeId?: string
  }): Promise<DuplicateCheckResult | null> {
    const data = await apiRequest<DuplicateCheckResult | null>(
      `/apps/duplicate-check${toQuery({
        name: input.name?.trim() || undefined,
        url: input.url?.trim() || undefined,
        excludeId: input.excludeId || undefined,
      })}`,
    )
    if (!data?.id) return null
    return {
      id: String(data.id),
      name: String(data.name ?? ""),
      url: String(data.url ?? ""),
      publishStatus: data.publishStatus,
      matchedBy: data.matchedBy === "url" ? "url" : "name",
    }
  },

  async listInterfaces(appId: string): Promise<AppInterface[]> {
    const data = await apiRequest<Partial<AppInterface>[]>(`/apps/${appId}/interfaces`)
    return (Array.isArray(data) ? data : []).map(mapInterface)
  },

  async replaceInterfaces(
    appId: string,
    drafts: AppInterfaceDraft[],
  ): Promise<{ ok: true; interfaces: AppInterface[] } | { ok: false; error: string }> {
    try {
      const data = await apiRequest<Partial<AppInterface>[]>(`/apps/${appId}/interfaces`, {
        method: "PUT",
        body: {
          interfaces: drafts.map((row, index) => ({
            label: row.label.trim(),
            url: row.url.trim() || undefined,
            username: row.username.trim() || undefined,
            password: row.password || undefined,
            sortOrder: index,
          })),
        },
      })
      return { ok: true, interfaces: (Array.isArray(data) ? data : []).map(mapInterface) }
    } catch (error) {
      if (error instanceof ApiError) return { ok: false, error: error.message || "تعذّر حفظ الواجهات." }
      return { ok: false, error: "تعذّر حفظ الواجهات." }
    }
  },
}
