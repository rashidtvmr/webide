import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/stores/auth'

interface GitHubCallbackSearch {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

export const Route = createFileRoute('/auth/callback')({
  validateSearch: (search: Record<string, unknown>): GitHubCallbackSearch => {
    return {
      code: search.code as string | undefined,
      state: search.state as string | undefined,
      error: search.error as string | undefined,
      error_description: search.error_description as string | undefined,
    }
  },
  component: GitHubCallbackComponent,
})

function GitHubCallbackComponent() {
  const search = useSearch({ from: '/auth/callback' })
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      if (search.error) {
        setError(`GitHub OAuth Error: ${search.error_description || search.error}`)
        setTimeout(() => {
          window.location.href = '/login'
        }, 3000)
        return
      }

      if (search.code) {
        try {
          // In a production app, you would exchange the code for a token on your backend
          // For now, we'll store the code as the token for demonstration
          // This should NEVER be done in production - always use a backend to handle OAuth
          
          const mockUserData = {
            name: 'GitHub User',
            email: 'user@github.com',
            avatar: 'https://avatars.githubusercontent.com/u/0',
            provider: 'github' as const,
            token: search.code, // In production: exchange this code for a real token on your backend
          }

          login(mockUserData)
          window.location.href = '/app'
        } catch (err) {
          setError(
            `Failed to complete authentication: ${err instanceof Error ? err.message : 'Unknown error'}`
          )
        }
      }
    }

    handleCallback()
  }, [search, login])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-2 text-lg font-bold text-red-900">Authentication Failed</h2>
          <p className="text-red-700">{error}</p>
          <p className="mt-4 text-sm text-red-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-white"></div>
        <p className="text-white">Processing your GitHub login...</p>
      </div>
    </div>
  )
}
