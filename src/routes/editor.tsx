import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/stores/auth'
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/editor')({
  component: EditorPage,
})

function EditorPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login', replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="w-full h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">MyEditor</h1>
        <p className="mt-4 text-lg">Your editor will appear here</p>
      </div>
    </div>
  )
}
