import {
  Outlet,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ApolloProviderWrapper } from "../integrations/apollo/provider";
import StoreDevtools from "../lib/demo-store-devtools";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { useAuthStore } from "@/stores/auth";

import type { QueryClient } from "@tanstack/react-query";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: ({ location }) => {
    const { isAuthenticated } = useAuthStore.getState();

    // Redirect to login if accessing protected /app routes without auth
    if (location.pathname.startsWith("/app") && !isAuthenticated) {
      throw redirect({
        to: "/login",
        replace: true,
      });
    }

    // Redirect to app if already authenticated and on login page
    if (location.pathname === "/login" && isAuthenticated) {
      throw redirect({
        to: "/editor",
        replace: true,
      });
    }
  },
  notFoundComponent: () => {
    const { isAuthenticated } = useAuthStore.getState();
    throw redirect({
      to: isAuthenticated ? "/editor" : "/login",
      replace: true,
    });
  },
  component: () => (
    <ApolloProviderWrapper>
      <Outlet />
      <TanStackDevtools
        config={{
          position: "bottom-right",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
          StoreDevtools,
          TanStackQueryDevtools,
        ]}
      />
    </ApolloProviderWrapper>
  ),
});
