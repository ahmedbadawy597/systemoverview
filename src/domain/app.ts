export type AppColor = "blue" | "ok" | "warn" | "plum"
export type AppIcon = "kpi" | "book" | "mosque" | "move" | "grid"
export type AppStatusLabel = "يعمل" | "محدَّث حديثًا" | "جديد"
export type AppPublishStatus = "draft" | "published" | "archived"

export interface WorkspaceApp {
  id: string
  name: string
  description: string | null
  url: string
  color: AppColor
  icon: AppIcon
  statusLabel: AppStatusLabel
  usersCount: number
  operationalReadinessPercent: number
  isFeatured: boolean
  publishedAt: string | null
  publishStatus: AppPublishStatus
  sortOrder: number
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAppInput {
  name: string
  description?: string
  url: string
  color: AppColor
  icon?: AppIcon
  statusLabel?: AppStatusLabel
  usersCount: number
  operationalReadinessPercent?: number
  isFeatured?: boolean
  sortOrder?: number
  publishNow?: boolean
}

export type UpdateAppInput = Omit<CreateAppInput, "publishNow">

export interface AppInterface {
  id: string
  appId: string
  label: string
  url: string | null
  username: string | null
  password: string | null
  hasPassword: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

/** Local draft row used in the create/edit form before/while syncing. */
export interface AppInterfaceDraft {
  /** Client key; persisted id when editing an existing row. */
  key: string
  id?: string
  label: string
  url: string
  username: string
  password: string
}

export interface WorkspaceAppsSummary {
  totalApps: number
  totalInterfaces: number
  avgOperationalReadinessPercent: number
  avgInterfacesPerApp: number
  alertsCount: number
  alertsLabel: string
  systemsHealthy: boolean
}

export const INTERFACE_LABEL_PRESETS = ["معالي الوزير", "مسؤول النظام", "مستخدم"] as const

export const APP_COLORS: { value: AppColor; label: string }[] = [
  { value: "blue", label: "أزرق" },
  { value: "ok", label: "أخضر" },
  { value: "warn", label: "ذهبي" },
  { value: "plum", label: "بنفسجي" },
]

export const APP_ICONS: { value: AppIcon; label: string }[] = [
  { value: "kpi", label: "مؤشرات" },
  { value: "book", label: "كتاب" },
  { value: "mosque", label: "مسجد" },
  { value: "move", label: "تنقلات" },
  { value: "grid", label: "شبكة" },
]

export const APP_STATUS_LABELS: AppStatusLabel[] = ["يعمل", "محدَّث حديثًا", "جديد"]

export const PUBLISH_STATUS_LABELS: Record<AppPublishStatus, string> = {
  draft: "مسودة",
  published: "منشور",
  archived: "مؤرشف",
}
