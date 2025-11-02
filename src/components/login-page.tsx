import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/stores/auth'
import { Github, Mail } from 'lucide-react'

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'your_client_id_here'
const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/callback`

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      login({
        email: email.trim(),
        provider: 'email',
      })

      navigate({ to: '/app' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubLogin = () => {
    const scopes = ['repo', 'gist', 'user:email']
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')

    githubAuthUrl.searchParams.append('client_id', GITHUB_CLIENT_ID)
    githubAuthUrl.searchParams.append('redirect_uri', REDIRECT_URI)
    githubAuthUrl.searchParams.append('scope', scopes.join(' '))
    githubAuthUrl.searchParams.append('allow_signup', 'true')

    window.location.href = githubAuthUrl.toString()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Sign in to continue to MyEditor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Login Form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full"
              variant="default"
            >
              <Mail className="mr-2 h-4 w-4" />
              {isLoading ? 'Signing in...' : 'Continue with Email'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* GitHub Login Button */}
          <Button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            <Github className="mr-2 h-4 w-4" />
            Continue with GitHub
          </Button>

          {/* Info Text */}
          <p className="text-center text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
