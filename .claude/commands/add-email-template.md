Add a new transactional email template to `packages/emails`.

Ask the user for the email name, recipient context, and what data it needs (e.g. user name, action URL), then:

1. Create `packages/emails/src/templates/<name>.tsx` — a React component returning plain HTML. Use `<html>`, `<head>`, `<body>`, `<p>`, `<a>` tags. Include charset and viewport meta in `<head>`:
   ```tsx
   <head>
     <meta charSet="utf-8" />
     <meta name="viewport" content="width=device-width" />
   </head>
   ```

2. Add a sender function in `packages/emails/src/index.ts`:
   ```ts
   export async function send<Name>Email(to: string, /* props */) {
     await send(to, 'Subject line', <Name>Email({ /* props */ }))
   }
   ```

3. Export it from `packages/emails/src/index.ts`.

4. Call the sender from the appropriate trigger point:
   - Auth events → `packages/auth/src/index.ts` (`databaseHooks` or `emailAndPassword` callbacks)
   - Billing events → `apps/api/src/modules/billing/billing.service.ts` webhook handler
   - Use fire-and-forget (`.catch()`) for non-critical emails; `await` for transactional flows where failure should surface to the user

5. Run `pnpm typecheck` to verify no type errors.

The sender is safe to call even without `RESEND_API_KEY` set — it silently skips with a console warning.
