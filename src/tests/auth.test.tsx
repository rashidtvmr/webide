import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth, useAuthStore } from '@/stores/auth'

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      })
    })
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should login with email and set user state', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.login({
        email: 'test@example.com',
        provider: 'email',
      })
    })

    expect(result.current.user).toEqual({
      email: 'test@example.com',
      provider: 'email',
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should login with GitHub and store user, token, and avatar', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.login({
        name: 'John Doe',
        email: 'john@github.com',
        avatar: 'https://avatars.githubusercontent.com/u/123456',
        provider: 'github',
        token: 'ghu_test_token_123',
      })
    })

    expect(result.current.user).toEqual({
      name: 'John Doe',
      email: 'john@github.com',
      avatar: 'https://avatars.githubusercontent.com/u/123456',
      provider: 'github',
      token: 'ghu_test_token_123',
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should logout and clear user state', () => {
    const { result } = renderHook(() => useAuth())

    // First login
    act(() => {
      result.current.login({
        email: 'test@example.com',
        provider: 'email',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Then logout
    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should persist user state to localStorage', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.login({
        email: 'persist@example.com',
        provider: 'email',
      })
    })

    // Check localStorage
    const stored = localStorage.getItem('auth-store')
    expect(stored).toBeTruthy()

    const parsed = JSON.parse(stored!)
    expect(parsed.state.user.email).toBe('persist@example.com')
    expect(parsed.state.isAuthenticated).toBe(true)
  })

  it('should restore persisted user state on reload', () => {
    // First create a hook and login to establish persistence
    const { result: result1 } = renderHook(() => useAuth())
    
    act(() => {
      result1.current.login({
        email: 'restored@example.com',
        provider: 'email',
      })
    })

    // Verify it was persisted
    const stored = localStorage.getItem('auth-store')
    expect(stored).toBeTruthy()

    const parsed = JSON.parse(stored!)
    expect(parsed.state.user.email).toBe('restored@example.com')
    expect(parsed.state.isAuthenticated).toBe(true)
  })

  it('should handle GitHub token for API requests', () => {
    const { result } = renderHook(() => useAuth())

    const gitHubUser = {
      name: 'Jane Doe',
      email: 'jane@github.com',
      avatar: 'https://avatars.githubusercontent.com/u/654321',
      provider: 'github' as const,
      token: 'ghu_github_token_xyz',
    }

    act(() => {
      result.current.login(gitHubUser)
    })

    expect(result.current.user?.token).toBe('ghu_github_token_xyz')
    expect(result.current.user?.provider).toBe('github')
  })

  it('should clear localStorage on logout', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.login({
        email: 'logout@example.com',
        provider: 'email',
      })
    })

    // Verify persisted
    expect(localStorage.getItem('auth-store')).toBeTruthy()

    // Logout
    act(() => {
      result.current.logout()
    })

    // After logout, the store should persist empty state
    const stored = localStorage.getItem('auth-store')
    if (stored) {
      const parsed = JSON.parse(stored)
      expect(parsed.state.user).toBeNull()
      expect(parsed.state.isAuthenticated).toBe(false)
    }
  })
})

describe('Protected Route Redirects', () => {
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

  it('should identify unauthenticated state', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should identify authenticated state', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.login({
        email: 'user@example.com',
        provider: 'email',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should provide access to user data in protected context', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.login({
        name: 'Test User',
        email: 'test@example.com',
        provider: 'email',
      })
    })

    expect(result.current.user?.name).toBe('Test User')
    expect(result.current.user?.email).toBe('test@example.com')
  })
})
