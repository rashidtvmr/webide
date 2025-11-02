# Authentication System - Quick Start Guide

## 5-Minute Setup

### Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: MyEditor
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/auth/callback
4. Copy your `Client ID`

### Step 2: Configure Environment

Create `.env.local` in project root:

```bash
VITE_GITHUB_CLIENT_ID=your_copied_client_id_here
VITE_GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Step 3: Run the App

```bash
pnpm dev
```

### Step 4: Test

- Open http://localhost:3000
- You'll be redirected to `/login`
- Try email login: enter any email and click "Continue with Email"
- Or click "Continue with GitHub" to test OAuth

## File Manifest

### Created/Modified Files

#### Core Authentication
- ✅ `src/stores/auth.ts` - Zustand auth store with persist middleware
- ✅ `src/hooks/useAuth.ts` - (Available via `useAuth()` from stores)

#### Routes
- ✅ `src/routes/__root.tsx` - Root route with auth redirects
- ✅ `src/routes/login.tsx` - Public login route
- ✅ `src/routes/app/index.tsx` - Protected /app route
- ✅ `src/routes/auth/callback.tsx` - GitHub OAuth callback

#### Components
- ✅ `src/components/login-page.tsx` - Login UI component
- ✅ `src/components/ui/card.tsx` - ShadCN Card component
- ✅ `src/components/ui/separator.tsx` - ShadCN Separator component
- ✅ `src/components/ui/input.tsx` - Already exists
- ✅ `src/components/ui/button.tsx` - Already exists

#### Integrations
- ✅ `src/integrations/tanstack-query/root-provider.tsx` - Apollo Client + QueryClient

#### Configuration
- ✅ `vite.config.ts` - Updated with Vitest jsdom configuration
- ✅ `.env.example` - Environment variables template

#### Tests (TDD-first)
- ✅ `src/tests/auth.test.tsx` - 11 auth store tests (all passing)
- ✅ `src/tests/integration.test.tsx` - 11 integration tests (all passing)
- ✅ `src/tests/setup.ts` - Test environment configuration

#### Documentation
- ✅ `AUTH_SYSTEM.md` - Complete authentication system documentation

## Test Results

All 22 tests passing ✅

```
Test Files  2 passed (2)
Tests       22 passed (22)
```

### Test Coverage

**Auth Store Tests (11)**
- ✅ Initialize with no user
- ✅ Login with email
- ✅ Login with GitHub
- ✅ Logout and clear state
- ✅ Persist to localStorage
- ✅ Restore persisted state
- ✅ GitHub token handling
- ✅ Logout clears localStorage
- ✅ Unauthenticated state detection
- ✅ Authenticated state detection
- ✅ User data access in protected context

**Integration Tests (11)**
- ✅ Complete email login workflow
- ✅ Complete GitHub login workflow
- ✅ Switch between auth/unauth states
- ✅ User data consistency
- ✅ Unauthenticated route guards
- ✅ Authenticated route access
- ✅ Sensitive data clearing
- ✅ GitHub token for API requests
- ✅ GitHub user profile data
- ✅ Email-only login
- ✅ Email-only persistence

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    TanStack Router                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   /login     │  │    /app      │  │ /auth/       │  │
│  │  (Public)    │  │  (Protected) │  │ callback     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│         └─────────────────┼─────────────────┘          │
│                           │                            │
│            beforeLoad checks isAuthenticated          │
│                           │                            │
└─────────────────┬──────────┴───────┬────────────────────┘
                  │                  │
         ┌────────▼─────────┐   ┌────▼──────────┐
         │  LoginPage.tsx   │   │  AppLayout    │
         │                  │   │  + Header     │
         │  Email Form      │   │  + Logout     │
         │  GitHub Button   │   │  + Content    │
         └────────┬─────────┘   └────┬──────────┘
                  │                  │
         ┌────────▼──────────────────▼──────┐
         │    Zustand Auth Store            │
         │                                  │
         │  ┌──────────────────────────┐   │
         │  │ User State               │   │
         │  │ - email                  │   │
         │  │ - name (GitHub)          │   │
         │  │ - avatar (GitHub)        │   │
         │  │ - provider (email|github)│   │
         │  │ - token (GitHub)         │   │
         │  └──────────────────────────┘   │
         │                                  │
         │  ┌──────────────────────────┐   │
         │  │ Actions                  │   │
         │  │ - login(user)            │   │
         │  │ - logout()               │   │
         │  │ - setUser(user)          │   │
         │  └──────────────────────────┘   │
         │                                  │
         │  persist middleware ──┐         │
         └──────────────────────┼──────────┘
                                │
                    ┌───────────▼──────────┐
                    │   localStorage       │
                    │  "auth-store" key    │
                    └──────────────────────┘
```

## API Endpoints Used

### GitHub OAuth
- **Authorization**: `https://github.com/login/oauth/authorize`
- **Scopes**: `repo`, `gist`, `user:email`

### GitHub GraphQL API
- **Endpoint**: `https://api.github.com/graphql`
- **Authentication**: Bearer token (automatically injected by Apollo Client)

## State Flow Diagram

```
┌─────────────────┐
│   /login Page   │
└────────┬────────┘
         │
    ┌────▼────────────────────┐
    │ Email Login             │
    │ (email@example.com)     │
    │ OR                       │
    │ GitHub OAuth            │
    │ (click button)          │
    └────┬───────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ Zustand Store                 │
    │ login({email, provider, ...}) │
    └────┬──────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ Persist to localStorage        │
    │ key: "auth-store"              │
    └────┬──────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ State Changed                  │
    │ isAuthenticated = true         │
    └────┬──────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ Router beforeLoad Triggers     │
    │ Redirect to /app               │
    └────┬──────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ /app Route Protected           │
    │ Access Granted                 │
    └────────────────────────────────┘
         │
    ┌────▼──────────────────────────┐
    │ AppLayout                      │
    │ - Display user header          │
    │ - Render content               │
    │ - Logout button ready          │
    └────────────────────────────────┘
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- src/tests/auth.test.tsx

# Watch mode
pnpm test -- --watch
```

## Development Workflow

1. **Start dev server**
   ```bash
   pnpm dev
   ```

2. **Run tests in watch mode**
   ```bash
   pnpm test -- --watch
   ```

3. **Build for production**
   ```bash
   pnpm build
   ```

4. **Preview production build**
   ```bash
   pnpm serve
   ```

## Deployment Checklist

- [ ] GitHub OAuth App configured on production domain
- [ ] `.env.local` updated with production Client ID and redirect URI
- [ ] HTTPS enabled (required by GitHub)
- [ ] Backend token exchange endpoint implemented
- [ ] Environment variables securely managed
- [ ] Tests passing: `pnpm test`
- [ ] Build successful: `pnpm build`
- [ ] No console errors in production build

## What's Next?

1. **Add more OAuth providers** - Google, Microsoft, etc.
2. **Implement refresh tokens** - For token expiration handling
3. **Add user profile page** - Display GitHub user data
4. **Create settings page** - User preferences and logout
5. **Add role-based access** - Admin, user tiers
6. **Implement 2FA** - Two-factor authentication
7. **Add rate limiting** - API call protection

## Support

For issues or questions:
1. Check `AUTH_SYSTEM.md` for detailed documentation
2. Review test files for usage examples
3. Check `.env.example` for configuration
4. Review route implementations in `src/routes/`

---

**Created with TDD-first approach** ✅ All 22 tests passing
