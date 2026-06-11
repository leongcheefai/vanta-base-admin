# packages/auth

## Purpose
Better Auth server instance. Single source of truth for auth configuration: session management, email+password, Google OAuth, and email hook wiring. Consumed by `apps/api` (server-side session handling) and `apps/app` (client-side auth state via `better-auth/react`).

## Conventions
- `src/index.ts` (`auth`) is server-only — never import it in browser code; use `src/client.ts` or create a `better-auth/react` client as `apps/app` does
- Google OAuth activates only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set — the conditional spread handles this automatically
- Welcome email is fire-and-forget (`.catch()`) so auth never fails if Resend is down; verify and reset emails are `await`ed intentionally

## Common tasks

### Enable Google OAuth
Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `apps/api/.env`. The conditional spread in `src/index.ts` activates the provider automatically. Add `signIn.social({ provider: 'google', callbackURL: '/dashboard' })` in `apps/app`.

### Add a new OAuth provider
Add to the `socialProviders` object in `src/index.ts` using the same conditional pattern as Google.

### Add a new email hook
Add an entry to `databaseHooks` or extend the `emailAndPassword` callbacks. Import the sender from `@vanta-base-admin/emails`. Use fire-and-forget (`.catch()`) for non-critical emails.

### Require email verification on signup
Set `requireEmailVerification: true` in the `emailAndPassword` block.

## Gotchas
- `BETTER_AUTH_URL` must point at the API (where `/api/auth/*` is mounted), not the frontend
- `trustedOrigins` is set to `APP_URL` — update it if the dashboard deploys to a different origin
- `auth.$Infer.Session` is used by `apps/api/src/lib/context.ts` for the Hono `AppVariables` type — changing session shape affects the API context
