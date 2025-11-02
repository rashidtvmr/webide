# Authentication System Documentation

## Overview

This TanStack Router app implements a complete authentication system with two login methods:
1. **Email-only login** - Simple email-based authentication stored in Zustand
2. **GitHub OAuth** - Full OAuth integration with GitHub API access

All auth state is persisted to localStorage using Zustand's persist middleware, enabling session restoration across page reloads.

## Architecture

### State Management (`/src/stores/auth.ts`)

The Zustand auth store manages:
- User state (name, email, avatar, provider, token)
- Authentication status
- Login/logout actions
- Automatic localStorage persistence

```typescript
interface User {
  name?: string
  email: string
  avatar?: string
  provider: 'email' | 'github'
  token?: string
}
```

### Routing (`/src/routes/`)

- `/login` - Public login page, redirects authenticated users to `/app`
- `/app` - Protected route with beforeLoad guard that checks authentication
- `/auth/callback` - GitHub OAuth callback handler

### Components

- `LoginPage` - ShadCN UI-based login form supporting email and GitHub OAuth
- `AppLayout` - Protected app layout with header, user info, and logout button
- ShadCN UI components: Card, Button, Input, Separator

### Data Layer

- **Apollo Client** - Configured for GitHub GraphQL API with automatic token injection
- **TanStack Query** - QueryClient for data fetching and caching

## Setup

### 1. Install Dependencies

All required packages are already installed. Key packages:
- `zustand` - State management
- `@apollo/client` - GraphQL client
- `@tanstack/react-query` - Data fetching
- `@tanstack/react-router` - File-based routing
- ShadCN UI components

### 2. Configure GitHub OAuth

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Create a new OAuth App with:
   - **Authorization callback URL**: `http://localhost:3000/auth/callback` (or your production URL)
3. Copy the `Client ID`
4. Create a `.env.local` file:
   ```bash
   VITE_GITHUB_CLIENT_ID=your_client_id
   VITE_GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback
   ```

### 3. Run the App

```bash
pnpm dev
```

Visit `http://localhost:3000/login` to see the login page.

## Usage

### Email Login

1. Enter your email on the login page
2. Click "Continue with Email"
3. You're redirected to `/app` and authenticated

The email is stored locally in Zustand and persisted to localStorage.

### GitHub OAuth Login

1. Click "Continue with GitHub"
2. GitHub redirects you to the OAuth authorization page
3. Approve the requested scopes (repo, gist, user:email)
4. GitHub redirects back to `/auth/callback` with an authorization code
5. The callback handler processes the code and logs you in
6. You're redirected to `/app`

**Important**: In production, exchange the authorization code for a token on your backend server. Never expose your GitHub Client Secret to the client.

### Accessing User Data

```typescript
import { useAuth } from '@/stores/auth'

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  return (
    <div>
      {isAuthenticated && (
        <>
          <img src={user?.avatar} alt={user?.email} />
          <p>{user?.name}</p>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  )
}
```

### Using GitHub Token with Apollo Client

The Apollo Client is automatically configured with the GitHub token from Zustand:

```typescript
import { useQuery, gql } from '@apollo/client'

const GET_USER = gql`
  query {
    viewer {
      login
      repositories(first: 10) {
        nodes {
          name
          description
        }
      }
    }
  }
`

export function GitHubRepos() {
  const { data } = useQuery(GET_USER)
  // Token is automatically sent in Authorization header
}
```

## Protected Routes

Any route under `/app` is protected by the `beforeLoad` hook in `/src/routes/app/index.tsx`:

```typescript
export const Route = createFileRoute('/app')({
  beforeLoad: async ({ navigate }) => {
    const { isAuthenticated } = useAuth.getState()
    if (!isAuthenticated) {
      navigate({ to: '/login', replace: true })
    }
  },
  component: AppLayout,
})
```

Unauthenticated users trying to access `/app` are redirected to `/login`.

## Persistence

Authentication state is automatically persisted to localStorage under the key `auth-store`:

```json
{
  "state": {
    "user": {
      "email": "user@example.com",
      "provider": "email"
    },
    "isAuthenticated": true
  },
  "version": 0
}
```

On app reload, the persisted state is automatically restored.

## Testing

Run tests with TDD-first implementation:

```bash
pnpm test
```

**Test Coverage** (22 tests):
- ✅ Auth store initialization
- ✅ Email login workflow
- ✅ GitHub OAuth login
- ✅ Logout and state clearing
- ✅ Persistence to localStorage
- ✅ State restoration on reload
- ✅ Protected route redirects
- ✅ User data consistency
- ✅ Sensitive data handling
- ✅ Complete integration flows

## File Structure

```
src/
├── stores/
│   └── auth.ts                 # Zustand auth store with persist
├── routes/
│   ├── __root.tsx              # Root route with auth redirects
│   ├── login.tsx               # Public login route
│   ├── app/
│   │   └── index.tsx           # Protected /app route
│   └── auth/
│       └── callback.tsx        # GitHub OAuth callback
├── components/
│   ├── login-page.tsx          # Login UI component
│   └── ui/
│       ├── card.tsx            # ShadCN Card component
│       ├── button.tsx          # ShadCN Button component
│       ├── input.tsx           # ShadCN Input component
│       └── separator.tsx       # ShadCN Separator component
├── integrations/
│   └── tanstack-query/
│       └── root-provider.tsx   # Apollo Client + QueryClient setup
└── tests/
    ├── auth.test.tsx           # Auth store unit tests
    ├── integration.test.tsx    # Integration tests
    └── setup.ts                # Test environment setup
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth App Client ID | `abc123xyz` |
| `VITE_GITHUB_REDIRECT_URI` | OAuth callback URL | `http://localhost:3000/auth/callback` |

## Best Practices

1. **Backend Token Exchange** - Always exchange GitHub authorization codes on your backend
2. **HTTPS in Production** - GitHub OAuth requires HTTPS in production
3. **Scope Minimization** - Request only necessary scopes (repo, gist, user:email)
4. **Secure Storage** - Never store secrets in the client; use backend for sensitive operations
5. **Token Refresh** - Implement token refresh logic if tokens expire

## Troubleshooting

### "Invalid Chai property" errors in tests
- Ensure `@testing-library/jest-dom` is installed and imported in `setup.ts`

### Route conflicts
- Avoid multiple routes with the same path
- Use `__root.tsx` as layout, not route definition

### GitHub OAuth fails
- Verify Client ID is correct
- Check Redirect URI matches GitHub settings exactly
- Ensure app is running on configured domain/port

### Persisted state not restoring
- Check browser localStorage is enabled
- Verify `auth-store` key exists in localStorage
- Clear localStorage and login again

## Next Steps

1. **Backend Integration**: Implement GitHub token exchange on backend
2. **GraphQL Queries**: Add GitHub API queries for repos, issues, etc.
3. **User Profile**: Create user profile page with GitHub data
4. **Multiple Providers**: Add more OAuth providers (Google, Microsoft, etc.)
5. **Session Management**: Add token refresh and expiration handling
