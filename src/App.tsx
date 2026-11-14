import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { FileQuestion, Loader2 } from "lucide-react"
import { createHashRouter, Link, Navigate, Outlet, RouterProvider } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { NoteActionsProvider } from "@/components/notes/NoteActionsProvider"
import { PrintReportProvider } from "@/components/report/PrintReportProvider"
import { Button } from "@/components/ui/button"
import { DirectionProvider } from "@/components/ui/direction"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AddNotePage } from "@/pages/AddNotePage"
import { AppFormPage } from "@/pages/AppFormPage"
import { ApprovalPage } from "@/pages/ApprovalPage"
import { AppsPage } from "@/pages/AppsPage"
import { CredentialsReportPage } from "@/pages/CredentialsReportPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { DeveloperReviewPage } from "@/pages/DeveloperReviewPage"
import { LoginPage } from "@/pages/LoginPage"
import { MinisterDashboardPage } from "@/pages/MinisterDashboardPage"
import { NoteDetailsPage } from "@/pages/NoteDetailsPage"
import { NotesPage } from "@/pages/NotesPage"
import { ReportsPage } from "@/pages/ReportsPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { UsersPage } from "@/pages/UsersPage"
import { AuthProvider, useAuth } from "@/services/auth/AuthProvider"

/** Apps workspace — assistant job title or system admin only. */
function RequireViewApps() {
  const { canViewApps } = useAuth()
  if (!canViewApps) return <Navigate to="/" replace />
  return <Outlet />
}

/** Create/edit/credentials — assistant or system admin only. */
function RequireManageApps() {
  const { canManageApps } = useAuth()
  if (!canManageApps) return <Navigate to="/apps" replace />
  return <Outlet />
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: 0 },
  },
})

/** Session gate and the providers that need the router. */
function AppShell() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 bg-background text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        جارٍ التحميل…
      </div>
    )
  }

  if (!user) return <LoginPage />

  return (
    <PrintReportProvider>
      <NoteActionsProvider>
        <Outlet />
      </NoteActionsProvider>
    </PrintReportProvider>
  )
}

function NotFoundPage() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="الصفحة غير موجودة"
      description="الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت."
      action={
        <Button asChild variant="outline">
          <Link to="/">العودة إلى الرئيسية</Link>
        </Button>
      }
    />
  )
}

const router = createHashRouter([
  { path: "/minister", element: <MinisterDashboardPage /> },
  {
    element: <AppShell />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "notes", element: <NotesPage /> },
          { path: "notes/new", element: <AddNotePage /> },
          { path: "notes/:id", element: <NoteDetailsPage /> },
          { path: "approval", element: <ApprovalPage /> },
          { path: "developer", element: <DeveloperReviewPage /> },
          { path: "reports", element: <ReportsPage /> },
          {
            element: <RequireViewApps />,
            children: [
              { path: "apps", element: <AppsPage /> },
              {
                element: <RequireManageApps />,
                children: [
                  { path: "apps/new", element: <AppFormPage /> },
                  { path: "apps/credentials", element: <CredentialsReportPage /> },
                  { path: "apps/:id/edit", element: <AppFormPage /> },
                ],
              },
            ],
          },
          { path: "users", element: <UsersPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

export default function App() {
  return (
    <DirectionProvider dir="rtl">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={250}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </DirectionProvider>
  )
}
