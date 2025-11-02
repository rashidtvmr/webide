import { useState } from 'react'
import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'your_client_id_here'
const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/callback`

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGitHubLogin = () => {
    setIsLoading(true)
    const scopes = ['repo', 'gist', 'user:email']
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')

    githubAuthUrl.searchParams.append('client_id', GITHUB_CLIENT_ID)
    githubAuthUrl.searchParams.append('redirect_uri', REDIRECT_URI)
    githubAuthUrl.searchParams.append('scope', scopes.join(' '))
    githubAuthUrl.searchParams.append('allow_signup', 'true')

    window.location.href = githubAuthUrl.toString()
  }

  return (
    <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/logo.svg" alt="MyEditor Logo" className="mr-2 h-6 w-6" />
          MyEditor
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "This editor has completely transformed how I write and manage my code. The integration with GitHub is seamless."
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>
          <div className="grid gap-6">
            <Button 
              variant="outline" 
              type="button" 
              disabled={isLoading}
              onClick={handleGitHubLogin}
              className="w-full"
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
          </div>
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
