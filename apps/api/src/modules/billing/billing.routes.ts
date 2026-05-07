import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../../lib/context";
import { createCheckoutSchema, createPortalSchema } from "./billing.schema";
import {
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  handleWebhook,
} from "./billing.service";

export const billingRouter = new Hono<{ Variables: AppVariables }>();

billingRouter.get("/subscription", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const subscription = await getSubscription(user.id);
  return c.json({ subscription: subscription ?? null });
});

billingRouter.post("/checkout", zValidator("json", createCheckoutSchema), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const input = c.req.valid("json");
  const result = await createCheckoutSession(user.id, input);
  return c.json(result);
});

billingRouter.post("/portal", zValidator("json", createPortalSchema), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const input = c.req.valid("json");
  const result = await createPortalSession(user.id, input);
  return c.json(result);
});

billingRouter.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) throw new HTTPException(400, { message: "Missing Stripe signature" });

  const body = await c.req.text();

  try {
    await handleWebhook(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    throw new HTTPException(400, { message });
  }

  return c.json({ received: true });
});
