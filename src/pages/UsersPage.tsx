import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import {
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  ShieldAlert,
  UserCog,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/common/EmptyState"
import { PageHeader, Panel, PanelHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JOB_TITLE_ORDER, JOB_TITLES, roleLabels, type JobTitle, type PublicUser } from "@/domain/user"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useAuth } from "@/services/auth/AuthProvider"
import { ROLE_ORDER, ROLES, type SystemRole } from "@/services/auth/roles"
import { createUser, listUsers, setUserRoles, updateUser } from "@/services/api/usersApi"

type EditorMode = "create" | "edit"

interface Draft {
  username: string
  fullName: string
  jobTitle: JobTitle
  roles: SystemRole[]
  password: string
  isActive: boolean
}

const EMPTY_DRAFT: Draft = {
  username: "",
  fullName: "",
  jobTitle: "staff_member",
  roles: ["staff"],
  password: "",
  isActive: true,
}

export function UsersPage() {
  const { can, user: me, refreshUser } = useAuth()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<EditorMode>("create")
  const [editing, setEditing] = useState<PublicUser | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await listUsers())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (can("manageUsers")) void reload()
  }, [can, reload])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(
      (u) =>
        u.username.includes(q) ||
        u.fullName.includes(q) ||
        JOB_TITLES[u.jobTitle].label.includes(q) ||
        roleLabels(u.roles).includes(q),
    )
  }, [users, query])

  if (!can("manageUsers")) {
    return (
      <div className="grid gap-6">
        <PageHeader title="إدارة المستخدمين" description="إنشاء الحسابات وتعيين المسمى الوظيفي وأدوار النظام." />
        <EmptyState icon={Lock} title="متاح للمدير فقط" description="إدارة المستخدمين تتطلب صلاحية المدير على حسابك." />
      </div>
    )
  }

  function openCreate() {
    setMode("create")
    setEditing(null)
    setDraft(EMPTY_DRAFT)
    setOpen(true)
  }

  function openEdit(user: PublicUser) {
    setMode("edit")
    setEditing(user)
    setDraft({
      username: user.username,
      fullName: user.fullName,
      jobTitle: user.jobTitle,
      roles: [...user.roles],
      password: "",
      isActive: user.isActive,
    })
    setOpen(true)
  }

  function toggleRole(role: SystemRole, checked: boolean) {
    setDraft((prev) => {
      const roles = checked ? [...new Set([...prev.roles, role])] : prev.roles.filter((r) => r !== role)
      return { ...prev, roles: roles.length ? roles : prev.roles }
    })
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    if (!me) return
    setSaving(true)
    try {
      if (mode === "create") {
        const result = await createUser(
          {
            username: draft.username,
            fullName: draft.fullName,
            jobTitle: draft.jobTitle,
            roles: draft.roles,
            password: draft.password,
            isActive: draft.isActive,
          },
          me.id,
        )
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        toast.success("تم إنشاء المستخدم")
      } else if (editing) {
        const updated = await updateUser(editing.id, {
          fullName: draft.fullName,
          jobTitle: draft.jobTitle,
          isActive: draft.isActive,
          password: draft.password || undefined,
        })
        if (!updated.ok) {
          toast.error(updated.error)
          return
        }
        const rolesResult = await setUserRoles(editing.id, draft.roles)
        if (!rolesResult.ok) {
          toast.error(rolesResult.error)
          await reload()
          return
        }
        toast.success("تم حفظ المستخدم")
        if (editing.id === me.id) await refreshUser()
      }
      setOpen(false)
      await reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="إدارة المستخدمين"
        description="المسمى الوظيفي للتعريف فقط. أدوار النظام (موظف نظام / تصديق / مبرمجين / مدير) هي التي تمنح الصلاحيات."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void reload()} disabled={loading}>
              <RefreshCw aria-hidden />
              تحديث
            </Button>
            <Button onClick={openCreate}>
              <Plus aria-hidden />
              مستخدم جديد
            </Button>
          </div>
        }
      />

      <div className="flex items-start gap-3 rounded-lg border border-[#ecdcae] bg-[#fbf6e8] px-4 py-3 text-[13px] leading-6 text-[#5e4a12]">
        <ShieldAlert className="mt-1 size-4 flex-none" aria-hidden />
        <p>الحسابات تُدار عبر خادم الوزارة. المسمى الوظيفي للتعريف فقط، وأدوار النظام هي التي تمنح الصلاحيات.</p>
      </div>

      <Panel>
        <PanelHeader
          title="الحسابات"
          description={`${filtered.length} من ${users.length} مستخدم`}
          actions={
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث بالاسم أو المستخدم أو الدور…"
              className="w-full sm:w-72"
            />
          }
        />
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            جارٍ التحميل…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={UserRound} title="لا يوجد مستخدمون" description="أنشئ أول حساب أو عدّل البحث." />
        ) : (
          <ul className="divide-y divide-line-soft">
            {filtered.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-11 flex-none items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                    {u.fullName.charAt(0)}
                  </span>
                  <div className="grid min-w-0 gap-1">
                    <p className="font-heading text-[16px] font-bold text-foreground">{u.fullName}</p>
                    <p className="text-[12.5px] text-muted-foreground">
                      @{u.username} · {JOB_TITLES[u.jobTitle].label}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {u.roles.map((r) => (
                        <span key={r} className="rounded-full bg-surface-tint px-2 py-0.5 text-[11px] font-bold text-brand ring-1 ring-brand/10">
                          {ROLES[r].label}
                        </span>
                      ))}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold ring-1",
                          u.isActive
                            ? "bg-[var(--status-resolved-bg)] text-[var(--status-resolved-ink)] ring-[var(--status-resolved-dot)]/20"
                            : "bg-surface-soft text-muted-foreground ring-line",
                        )}
                      >
                        {u.isActive ? "نشط" : "موقوف"}
                      </span>
                    </div>
                    {u.lastLoginAt && (
                      <p className="text-[11.5px] text-muted-foreground">آخر دخول: {formatDateTime(u.lastLoginAt)}</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={() => openEdit(u)}>
                  <UserCog aria-hidden />
                  تعديل
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={onSave} className="grid gap-5">
            <DialogHeader>
              <DialogTitle>{mode === "create" ? "مستخدم جديد" : "تعديل مستخدم"}</DialogTitle>
              <DialogDescription>
                عيّن المسمى الوظيفي وأدوار النظام. يمكن منح أكثر من دور لنفس الحساب.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="user-username">اسم المستخدم</Label>
                <Input
                  id="user-username"
                  value={draft.username}
                  onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
                  disabled={mode === "edit"}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="user-fullname">الاسم الكامل</Label>
                <Input
                  id="user-fullname"
                  value={draft.fullName}
                  onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label>المسمى الوظيفي</Label>
                <Select value={draft.jobTitle} onValueChange={(v) => setDraft((d) => ({ ...d, jobTitle: v as JobTitle }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TITLE_ORDER.map((t) => (
                      <SelectItem key={t} value={t}>
                        {JOB_TITLES[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <fieldset className="grid gap-2">
                <legend className="text-sm font-semibold text-foreground">أدوار النظام</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ROLE_ORDER.map((role) => {
                    const checked = draft.roles.includes(role)
                    return (
                      <label
                        key={role}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
                          checked ? "border-brand/30 bg-surface-tint/50" : "border-line bg-surface",
                        )}
                      >
                        <Checkbox checked={checked} onCheckedChange={(v) => toggleRole(role, v === true)} className="mt-0.5" />
                        <span className="grid gap-0.5">
                          <span className="text-[13px] font-bold">{ROLES[role].label}</span>
                          <span className="text-[11.5px] leading-5 text-muted-foreground">{ROLES[role].description}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <div className="grid gap-1.5">
                <Label htmlFor="user-password">{mode === "create" ? "كلمة المرور" : "كلمة مرور جديدة (اختياري)"}</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={draft.password}
                  onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
                  required={mode === "create"}
                  autoComplete="new-password"
                  placeholder={mode === "edit" ? "اتركها فارغة للإبقاء على الحالية" : undefined}
                />
              </div>
              <label className="flex items-center gap-2.5 text-[13px]">
                <Checkbox checked={draft.isActive} onCheckedChange={(v) => setDraft((d) => ({ ...d, isActive: v === true }))} />
                الحساب نشط
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving || draft.roles.length === 0}>
                {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
