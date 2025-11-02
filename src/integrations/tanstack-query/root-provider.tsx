import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'

export function getContext() {
  const queryClient = new QueryClient()

  // Get the token from auth store
  const { user } = useAuthStore.getState()

  // Create Apollo Client with GitHub GraphQL endpoint
  const apolloClient = new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: new HttpLink({
      uri: 'https://api.github.com/graphql',
      credentials: 'include',
      headers: {
        Authorization: user?.token ? `Bearer ${user.token}` : '',
      },
    }),
    cache: new InMemoryCache(),
  })

  return {
    queryClient,
    apolloClient,
  }
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
