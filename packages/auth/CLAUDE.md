# packages/auth

## Purpose
Better Auth server instance. Single source of truth for auth configuration: session management, email+password (login only — signup disabled), and email hook wiring. Consumed by `apps/api` (server-side session handling) and `apps/app` (client-side auth state via `better-auth/react`). Accounts are admin-provisioned via the `admin()` plugin.

## Conventions
- `src/index.ts` (`auth`) is server-only — never import it in browser code; use `src/client.ts` or create a `better-auth/react` client as `apps/app` does
- `disableSignUp: true` is set — users cannot self-register; use the admin dashboard to create accounts
- Welcome email is fire-and-forget (`.catch()`) so auth never fails if Resend is down; verify and reset emails are `await`ed intentionally

## Common tasks

### Add a new email hook
Add an entry to `databaseHooks` or extend the `emailAndPassword` callbacks. Import the sender from `@vanta-base-admin/emails`. Use fire-and-forget (`.catch()`) for non-critical emails.

## Gotchas
- `BETTER_AUTH_URL` must point at the API (where `/api/auth/*` is mounted), not the frontend
- `trustedOrigins` is set to `APP_URL` — update it if the dashboard deploys to a different origin
- `auth.$Infer.Session` is used by `apps/api/src/lib/context.ts` for the Hono `AppVariables` type — changing session shape affects the API context
