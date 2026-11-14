import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

const COLLAPSE_KEY = "notes-system.sidebar-collapsed"

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1"
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0")
    } catch {
      // UI preference only
    }
  }, [collapsed])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-dvh bg-background print:hidden">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:start-3"
      >
        تخطي إلى المحتوى
      </a>

      <div
        className={cn(
          "fixed inset-y-0 start-0 z-40 hidden border-e border-line transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
          collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]",
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-[var(--sidebar-width)] max-w-[85vw] gap-0 p-0 sm:max-w-[var(--sidebar-width)]">
          <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
          <SheetDescription className="sr-only">التنقل بين صفحات النظام</SheetDescription>
          <Sidebar onNavigate={() => setMobileOpen(false)} className="w-full" />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col overflow-x-clip transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          collapsed ? "lg:ps-[var(--sidebar-collapsed)]" : "lg:ps-[var(--sidebar-width)]",
        )}
      >
        <Header onOpenMobileNav={() => setMobileOpen(true)} />
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto grid w-full min-w-0 max-w-[1400px] flex-1 content-start gap-6 overflow-x-clip px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <div key={pathname} className="page-enter grid min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
