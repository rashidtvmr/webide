import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/components/login-page'
import { useAuth } from '@/stores/auth'
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: LoginComponent
})

function LoginComponent() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/editor', replace: true })
    }
  }, [isAuthenticated, navigate])

  return <LoginPage />
}
