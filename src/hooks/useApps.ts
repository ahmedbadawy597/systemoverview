import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AppInterfaceDraft, CreateAppInput, UpdateAppInput } from "@/domain/app"
import { appsApi, type AppListQuery } from "@/services/api/appsApi"

export const APPS_KEY = ["apps"] as const

export function appsQueryKey(query: AppListQuery) {
  return [...APPS_KEY, "list", query] as const
}

export function useAppsList(query: AppListQuery, enabled = true) {
  return useQuery({
    queryKey: appsQueryKey(query),
    queryFn: () => appsApi.list(query),
    staleTime: 15_000,
    enabled,
  })
}

export function useAppsWorkspaceSummary(enabled = true) {
  return useQuery({
    queryKey: [...APPS_KEY, "workspace-summary"] as const,
    queryFn: () => appsApi.workspaceSummary(),
    staleTime: 15_000,
    enabled,
  })
}

export function useApp(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...APPS_KEY, "detail", id] as const,
    queryFn: () => appsApi.get(id!),
    enabled: Boolean(id) && enabled,
    staleTime: 15_000,
  })
}

export function useAppInterfaces(appId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...APPS_KEY, "interfaces", appId] as const,
    queryFn: () => appsApi.listInterfaces(appId!),
    enabled: Boolean(appId) && enabled,
    staleTime: 10_000,
  })
}

export function useCreateApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAppInput) => appsApi.create(input),
    onSuccess: (result) => {
      if (!result.ok) {
        // DUPLICATE_APP + field validation are surfaced inline on the form.
        if (result.code !== "DUPLICATE_APP" && !result.fieldErrors?.length) {
          toast.error(result.error)
        }
        return
      }
      toast.success(result.app.publishStatus === "published" ? "تم إنشاء التطبيق ونشره." : "تم حفظ التطبيق كمسودة.")
      void qc.invalidateQueries({ queryKey: APPS_KEY })
    },
  })
}

export function useUpdateApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAppInput }) => appsApi.update(id, input),
    onSuccess: (result) => {
      if (!result.ok) {
        if (result.code !== "DUPLICATE_APP" && !result.fieldErrors?.length) {
          toast.error(result.error)
        }
        return
      }
      toast.success("تم حفظ تعديلات التطبيق.")
      void qc.invalidateQueries({ queryKey: APPS_KEY })
    },
  })
}

export function usePublishApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appsApi.publish(id),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("تم نشر التطبيق.")
      void qc.invalidateQueries({ queryKey: APPS_KEY })
    },
  })
}

export function useUnpublishApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appsApi.unpublish(id),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("أُعيد التطبيق إلى المسودة.")
      void qc.invalidateQueries({ queryKey: APPS_KEY })
    },
  })
}

export function useDeleteApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appsApi.remove(id),
    onSuccess: (result) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("تم حذف التطبيق.")
      void qc.invalidateQueries({ queryKey: APPS_KEY })
    },
  })
}

export function useReplaceAppInterfaces() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appId, drafts }: { appId: string; drafts: AppInterfaceDraft[] }) =>
      appsApi.replaceInterfaces(appId, drafts),
    onSuccess: (result, vars) => {
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      void qc.invalidateQueries({ queryKey: [...APPS_KEY, "interfaces", vars.appId] })
      void qc.invalidateQueries({ queryKey: [...APPS_KEY, "workspace-summary"] })
    },
  })
}
