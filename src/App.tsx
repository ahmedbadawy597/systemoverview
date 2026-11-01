import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { FileQuestion } from "lucide-react"
import { createHashRouter, Link, Outlet, RouterProvider } from "react-router-dom"
import { EmptyState } from "@/components/common/EmptyState"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { NoteActionsProvider } from "@/components/notes/NoteActionsProvider"
import { PrintReportProvider } from "@/components/report/PrintReportProvider"
import { Button } from "@/components/ui/button"
import { DirectionProvider } from "@/components/ui/direction"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AccessPage } from "@/pages/AccessPage"
import { AddNotePage } from "@/pages/AddNotePage"
import { ApprovalPage } from "@/pages/ApprovalPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { DeveloperReviewPage } from "@/pages/DeveloperReviewPage"
import { NoteDetailsPage } from "@/pages/NoteDetailsPage"
import { NotesPage } from "@/pages/NotesPage"
import { ReportsPage } from "@/pages/ReportsPage"
import { MinisterDashboardPage } from "@/pages/MinisterDashboardPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { AuthProvider, useAuth } from "@/services/auth/AuthProvider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: 0 },
  },
})

/** Session gate and the providers that need the router. */
function AppShell() {
  const { role } = useAuth()
  if (!role) return <AccessPage />
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
