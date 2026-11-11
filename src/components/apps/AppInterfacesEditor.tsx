import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { INTERFACE_LABEL_PRESETS, type AppInterfaceDraft } from "@/domain/app"

function newDraft(label = ""): AppInterfaceDraft {
  return {
    key: crypto.randomUUID(),
    label,
    url: "",
    username: "",
    password: "",
  }
}

interface AppInterfacesEditorProps {
  value: AppInterfaceDraft[]
  onChange: (next: AppInterfaceDraft[]) => void
  disabled?: boolean
}

export function AppInterfacesEditor({ value, onChange, disabled }: AppInterfacesEditorProps) {
  function update(key: string, patch: Partial<AppInterfaceDraft>) {
    onChange(value.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }

  function remove(key: string) {
    onChange(value.filter((row) => row.key !== key))
  }

  function move(key: string, dir: -1 | 1) {
    const index = value.findIndex((row) => row.key === key)
    const next = index + dir
    if (index < 0 || next < 0 || next >= value.length) return
    const copy = [...value]
    const [row] = copy.splice(index, 1)
    copy.splice(next, 0, row)
    onChange(copy)
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2">
        <div className="grid gap-1">
          <h3 className="text-[14px] font-bold text-foreground">واجهات الدخول (حسب الدور)</h3>
          <p className="text-[12px] text-muted-foreground">
            أضف أي عدد من الواجهات. كلمات المرور تُحفظ مشفّرة ولا تظهر في واجهة الوزير.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {INTERFACE_LABEL_PRESETS.map((label) => (
            <Button
              key={label}
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => onChange([...value, newDraft(label)])}
            >
              + {label}
            </Button>
          ))}
          <Button type="button" size="sm" disabled={disabled} onClick={() => onChange([...value, newDraft()])}>
            <Plus className="size-3.5" aria-hidden />
            واجهة
          </Button>
        </div>
      </div>

      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface-soft/60 px-4 py-6 text-center text-[13px] text-muted-foreground">
          لا توجد واجهات بعد. ابدأ بإضافة صف أو اختر إعدادًا سريعًا أعلاه.
        </p>
      ) : (
        <div className="grid gap-3">
          {value.map((row, index) => (
            <div key={row.key} className="grid gap-3 rounded-xl border border-line bg-surface-soft/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-muted-foreground">واجهة {index + 1}</span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    disabled={disabled || index === 0}
                    onClick={() => move(row.key, -1)}
                    aria-label="تحريك لأعلى"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    disabled={disabled || index === value.length - 1}
                    onClick={() => move(row.key, 1)}
                    aria-label="تحريك لأسفل"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={disabled}
                    onClick={() => remove(row.key)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    حذف
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                  <Label>المسمى / الدور</Label>
                  <Input
                    value={row.label}
                    onChange={(e) => update(row.key, { label: e.target.value })}
                    placeholder="مثال: معالي الوزير"
                    disabled={disabled}
                    maxLength={120}
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label>رابط الواجهة</Label>
                  <Input
                    dir="ltr"
                    className="text-start"
                    value={row.url}
                    onChange={(e) => update(row.key, { url: e.target.value })}
                    placeholder="https://…"
                    disabled={disabled}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>اسم المستخدم</Label>
                  <Input
                    dir="ltr"
                    className="text-start"
                    value={row.username}
                    onChange={(e) => update(row.key, { username: e.target.value })}
                    disabled={disabled}
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>كلمة المرور</Label>
                  <Input
                    dir="ltr"
                    className="text-start"
                    type="text"
                    value={row.password}
                    onChange={(e) => update(row.key, { password: e.target.value })}
                    placeholder={row.id ? "اتركها كما هي أو اكتب كلمة جديدة" : undefined}
                    disabled={disabled}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function draftsFromInterfaces(
  rows: Array<{
    id: string
    label: string
    url: string | null
    username: string | null
    password: string | null
  }>,
): AppInterfaceDraft[] {
  return rows.map((row) => ({
    key: row.id,
    id: row.id,
    label: row.label,
    url: row.url ?? "",
    username: row.username ?? "",
    password: row.password ?? "",
  }))
}
