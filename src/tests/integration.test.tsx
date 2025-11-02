import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act } from '@testing-library/react'
import { useAuth, useAuthStore } from '@/stores/auth'

describe('Auth Store Integration Tests', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      })
    })
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should complete full email login workflow', () => {
    const { login, logout } = useAuthStore.getState()

    // Initial state: not authenticated
    expect(useAuthStore.getState().isAuthenticated).toBe(false)

    // Login
    act(() => {
      login({
        email: 'workflow@example.com',
        provider: 'email',
      })
    })

    // Verify authenticated
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user?.email).toBe('workflow@example.com')

    // Verify persisted
    const stored = localStorage.getItem('auth-store')
    expect(stored).toBeTruthy()

    // Logout
    act(() => {
      logout()
    })

    // Verify logged out
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('should complete full GitHub login workflow', () => {
    const { login } = useAuthStore.getState()

    // Simulate GitHub OAuth callback
    act(() => {
      login({
        name: 'John Doe',
        email: 'john@github.com',
        avatar: 'https://avatars.githubusercontent.com/u/123456',
        provider: 'github',
        token: 'ghu_test_token_123',
      })
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().user?.name).toBe('John Doe')
    expect(useAuthStore.getState().user?.token).toBe('ghu_test_token_123')
    expect(useAuthStore.getState().user?.provider).toBe('github')

    // Verify persistence
    const stored = localStorage.getItem('auth-store')
    expect(stored).toBeTruthy()
    const parsed = JSON.parse(stored!)
    expect(parsed.state.user.provider).toBe('github')
  })

  it('should handle switching between authenticated and unauthenticated states', () => {
    const { login, logout } = useAuthStore.getState()

    // Login
    act(() => {
      login({
        email: 'switch@example.com',
        provider: 'email',
      })
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // Logout
    act(() => {
      logout()
    })
    expect(useAuthStore.getState().isAuthenticated).toBe(false)

    // Login again with different method
    act(() => {
      login({
        name: 'GitHub User',
        email: 'github@example.com',
        provider: 'github',
        token: 'token_xyz',
      })
    })
    expect(useAuthStore.getState().user?.provider).toBe('github')
  })

  it('should maintain user data consistency across multiple operations', () => {
    const { login, logout } = useAuthStore.getState()

    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      avatar: 'https://example.com/avatar.jpg',
      provider: 'github' as const,
      token: 'test_token',
    }

    act(() => {
      login(userData)
    })

    // Verify all data is stored
    const state = useAuthStore.getState()
    expect(state.user?.name).toBe(userData.name)
    expect(state.user?.email).toBe(userData.email)
    expect(state.user?.avatar).toBe(userData.avatar)
    expect(state.user?.token).toBe(userData.token)

    // Verify persistence matches
    const stored = JSON.parse(localStorage.getItem('auth-store')!)
    expect(stored.state.user).toEqual(userData)
  })
})

describe('Protected Route Logic', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      })
    })
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should detect unauthenticated state for route guards', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
  })

  it('should provide authenticated state for route access', () => {
    const { login } = useAuthStore.getState()

    act(() => {
      login({
        email: 'protected@example.com',
        provider: 'email',
      })
    })

    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user?.email).toBe('protected@example.com')
  })

  it('should clear sensitive data on logout', () => {
    const { login, logout } = useAuthStore.getState()

    act(() => {
      login({
        name: 'Sensitive User',
        email: 'sensitive@example.com',
        provider: 'github',
        token: 'sensitive_token_xyz',
      })
    })

    // Verify data exists
    expect(useAuthStore.getState().user?.token).toBe('sensitive_token_xyz')

    // Logout
    act(() => {
      logout()
    })

    // Verify all data cleared
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe('GitHub OAuth Flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should store GitHub token for API requests', () => {
    const { login } = useAuthStore.getState()
    const githubToken = 'ghu_github_token_xyz_production'

    act(() => {
      login({
        name: 'GitHub Developer',
        email: 'dev@github.com',
        avatar: 'https://avatars.githubusercontent.com/u/999999',
        provider: 'github',
        token: githubToken,
      })
    })

    const state = useAuthStore.getState()
    expect(state.user?.token).toBe(githubToken)
    expect(state.user?.provider).toBe('github')

    // Token should be available for Apollo Client
    const persisted = JSON.parse(localStorage.getItem('auth-store')!)
    expect(persisted.state.user.token).toBe(githubToken)
  })

  it('should handle GitHub user profile data correctly', () => {
    const { login } = useAuthStore.getState()

    const gitHubUserProfile = {
      name: 'Octocat',
      email: 'octocat@github.com',
      avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      provider: 'github' as const,
      token: 'ghu_octocat_token',
    }

    act(() => {
      login(gitHubUserProfile)
    })

    const state = useAuthStore.getState()
    expect(state.user).toEqual(gitHubUserProfile)
  })
})

describe('Email-Only Authentication', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should login with email only', () => {
    const { login } = useAuthStore.getState()

    act(() => {
      login({
        email: 'email.only@example.com',
        provider: 'email',
      })
    })

    const state = useAuthStore.getState()
    expect(state.user?.email).toBe('email.only@example.com')
    expect(state.user?.provider).toBe('email')
    expect(state.user?.token).toBeUndefined()
    expect(state.user?.name).toBeUndefined()
  })

  it('should persist email-only authentication', () => {
    const { login } = useAuthStore.getState()

    act(() => {
      login({
        email: 'persist.email@example.com',
        provider: 'email',
      })
    })

    const persisted = JSON.parse(localStorage.getItem('auth-store')!)
    expect(persisted.state.user.email).toBe('persist.email@example.com')
    expect(persisted.state.user.provider).toBe('email')
    expect(persisted.state.isAuthenticated).toBe(true)
  })
})
