import { Outlet, createRootRouteWithContext, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import StoreDevtools from '../lib/demo-store-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import { useAuthStore } from '@/stores/auth'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: ({ location }) => {
    const { isAuthenticated } = useAuthStore.getState()

    // Redirect to login if accessing protected /app routes without auth
    if (location.pathname.startsWith('/app') && !isAuthenticated) {
      throw redirect({
        to: '/login',
        replace: true,
      })
    }

    // Redirect to app if already authenticated and on login page
    if (location.pathname === '/login' && isAuthenticated) {
      throw redirect({
        to: '/app',
        replace: true,
      })
    }
  },
  component: () => (
    <>
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          StoreDevtools,
          TanStackQueryDevtools,
        ]}
      />
    </>
  ),
})
