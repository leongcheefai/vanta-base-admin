# packages/emails

## Purpose
Transactional email sending via Resend. Renders React Email templates to HTML and delivers them. If `RESEND_API_KEY` is not set, all sends silently no-op — the app boots and runs without Resend credentials.

## Conventions
- All public API is four named exports: `sendWelcomeEmail`, `sendVerifyEmail`, `sendResetPasswordEmail`, `sendPaymentFailedEmail`
- Templates are React components returning plain HTML — no external CSS, no images; style with inline styles or `@react-email/components` if needed
- Callers decide sync vs fire-and-forget: `packages/auth` uses `.catch()` for welcome; `apps/api` uses `.catch()` for payment-failed; verify and reset are `await`ed intentionally

## Common tasks

### Add a new email template
1. Create `src/templates/<name>.tsx` — a React component returning plain HTML
2. Add a `send<Name>Email(to: string, ...)` function in `src/index.ts` calling `send()`
3. Export it from `src/index.ts`

### Change the sender address
Update the `FROM` constant in `src/index.ts`. The domain must be verified in the Resend dashboard before going live.

### Test emails locally
Set `RESEND_API_KEY` in `apps/api/.env`. Leave unset to have sends silently skip with a console warning.

## Gotchas
- `RESEND_API_KEY` absent = silent no-op, not an error; check `console.warn` output to confirm skips
- `FROM` address (`noreply@vanta-base-admin.dev`) will fail sending until that domain is verified in Resend
- Templates are plain HTML stubs — functional but unstyled; visual polish is deferred
- No build step — TypeScript source exported directly
