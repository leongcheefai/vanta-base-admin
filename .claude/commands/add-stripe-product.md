Add a new Stripe product and wire it into the billing flow.

Ask the user for the product name, price, and billing interval (monthly/yearly/one-time), then:

1. In the Stripe Dashboard (test mode), create a new Product with a Price. Copy the `price_...` ID.

2. Add the price ID to `apps/api/.env`:
   ```
   STRIPE_PRO_PRICE_ID=price_...
   ```
   Or add a new env var in `packages/env/src/index.ts` for additional plan tiers (e.g. `STRIPE_ENTERPRISE_PRICE_ID`).

3. If the product needs a dedicated checkout button in `apps/app`, update `apps/app/src/routes/dashboard/billing.tsx` — replace `TODO_REPLACE_PRICE_ID` or add a new mutation that passes the correct `priceId` to `POST /billing/checkout`.

4. The webhook handling in `apps/api/src/modules/billing/billing.service.ts` already handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed` generically — no changes needed there for a new product.

5. To test locally, forward webhooks with the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/billing/webhook
   stripe trigger checkout.session.completed
   ```

6. Run `pnpm typecheck` to verify no type errors.
