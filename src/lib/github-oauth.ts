// GitHub OAuth Configuration
export const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID
export const GITHUB_CLIENT_SECRET = import.meta.env.VITE_GITHUB_CLIENT_SECRET
export const GITHUB_REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || `${window.location.origin}/auth/callback`

export function generateGitHubAuthUrl() {
  const state = crypto.randomUUID()
  sessionStorage.setItem('github_oauth_state', state)
  
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID || '',
    redirect_uri: GITHUB_REDIRECT_URI,
    state,
    scope: 'read:user user:email repo',
  })

  return `https://github.com/login/oauth/authorize?${params.toString()}`
}