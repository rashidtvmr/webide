import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useAuth } from '@/stores/auth'

export const Route = createFileRoute('/app/')({
  beforeLoad: async ({ navigate }) => {
    const { isAuthenticated } = useAuth.getState()
    if (!isAuthenticated) {
      navigate({ to: '/login', replace: true })
    }
  },
  component: AppLayout,
})

function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900">MyEditor</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name || user.email}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <div className="text-sm">
                <p className="font-medium text-slate-900">{user?.name || user?.email}</p>
                <p className="text-xs text-slate-500">{user?.provider}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome to MyEditor</h2>
            <p className="mt-2 text-slate-600">You're successfully authenticated!</p>
            <p className="mt-4 text-sm text-slate-500">
              This is your protected app area. Only authenticated users can access this page.
            </p>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
