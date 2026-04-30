# apps/api

## Purpose
Hono API server on Node.js. Handles auth (Better Auth), billing (Stripe), and all business logic. Runs on port 3001 in development.

## Conventions
- Every feature lives in `src/modules/<name>/` — three files: `<name>.routes.ts`, `<name>.service.ts`, `<name>.schema.ts`
- Routes export a Hono router; mount it in `src/lib/app.ts` — never add routes directly to `app.ts`
- Use `@hono/zod-validator` for request validation — never trust raw `c.req.json()` on mutating endpoints
- Auth check: `const user = c.get('user'); if (!user) throw new HTTPException(401, ...)`
- All env access via `@praxor-kit/env` (the `serverEnv` export) — never `process.env`

## Common tasks

### Add a new API route
1. Create or extend `src/modules/<feature>/`
2. Add Zod schema in `<feature>.schema.ts`
3. Add business logic in `<feature>.service.ts`
4. Export a Hono router from `<feature>.routes.ts`
5. Mount in `src/lib/app.ts`: `app.route('/<feature>', featureRouter)`

### Test an endpoint manually
```bash
# Health check
curl http://localhost:3001/health

# Authenticated endpoint (requires session cookie)
curl http://localhost:3001/me -H "Cookie: <session-cookie>"
```

## Stripe + Billing

### Local webhook testing with Stripe CLI
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/billing/webhook

# The CLI prints a webhook signing secret — add to .env as STRIPE_WEBHOOK_SECRET
```

### Webhook events handled
| Event | Action |
|---|---|
| `checkout.session.completed` | Upsert subscription row with active status |
| `customer.subscription.updated` | Update plan/status/period-end |
| `customer.subscription.deleted` | Mark subscription canceled |
| `invoice.payment_failed` | Mark subscription past_due |

### Trigger test events
```bash
# Simulate a completed checkout
stripe trigger checkout.session.completed

# Simulate payment failure
stripe trigger invoice.payment_failed
```

### Adding a new Stripe product
1. Create product + price in Stripe Dashboard (test mode)
2. Copy the `price_...` ID
3. Pass it as `priceId` to `POST /billing/checkout`

## Gotchas
- Webhook endpoint at `POST /billing/webhook` must receive the **raw body** for signature verification — do not add JSON body-parsing middleware to this route
- Stripe API version is pinned in `src/lib/stripe.ts` — update after checking Stripe changelog for breaking changes
- `subscription_data.metadata.userId` is set on checkout so webhooks can look up the user without a customer lookup
