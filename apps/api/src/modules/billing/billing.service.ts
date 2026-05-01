import { eq } from 'drizzle-orm'
import { db, schema } from '@praxor-kit/db'
import { serverEnv } from '@praxor-kit/env'
import { sendPaymentFailedEmail } from '@praxor-kit/emails'
import { stripe } from '../../lib/stripe'
import type { CreateCheckoutInput, CreatePortalInput } from './billing.schema'

type SubscriptionStatus = typeof schema.subscriptionStatusEnum.enumValues[number]

export async function createCheckoutSession(userId: string, input: CreateCheckoutInput) {
  const existing = await db.query.subscription.findFirst({
    where: eq(schema.subscription.userId, userId),
  })

  let customerId = existing?.stripeCustomerId ?? undefined

  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { userId } })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    // userId on session metadata so webhook can identify the user
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  })

  return { url: session.url }
}

export async function createPortalSession(userId: string, input: CreatePortalInput) {
  const existing = await db.query.subscription.findFirst({
    where: eq(schema.subscription.userId, userId),
  })

  if (!existing?.stripeCustomerId) {
    throw new Error('No Stripe customer found for this user')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: existing.stripeCustomerId,
    return_url: input.returnUrl,
  })

  return { url: session.url }
}

export async function getSubscription(userId: string) {
  return db.query.subscription.findFirst({
    where: eq(schema.subscription.userId, userId),
  })
}

export async function handleWebhook(body: string, signature: string) {
  const event = stripe.webhooks.constructEvent(body, signature, serverEnv.STRIPE_WEBHOOK_SECRET)

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      if (session.mode !== 'subscription') break
      const userId = session.metadata?.userId
      if (!userId || !session.customer || !session.subscription) break

      const subId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id
      const sub = await stripe.subscriptions.retrieve(subId)

      await upsertSubscription({
        userId,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer.id,
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0]?.price.id ?? null,
        stripeCurrentPeriodEnd: new Date(sub.items.data[0]?.current_period_end * 1000),
        status: sub.status as SubscriptionStatus,
      })
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const userId = sub.metadata?.userId
      if (!userId) break

      await upsertSubscription({
        userId,
        stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0]?.price.id ?? null,
        stripeCurrentPeriodEnd: new Date(sub.items.data[0]?.current_period_end * 1000),
        status: sub.status as SubscriptionStatus,
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await db
        .update(schema.subscription)
        .set({ status: 'canceled', updatedAt: new Date() })
        .where(eq(schema.subscription.stripeSubscriptionId, sub.id))
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      // In Stripe API 2026+, subscription ref lives under invoice.parent.subscription_details
      const subRef = invoice.parent?.subscription_details?.subscription
      if (!subRef) break
      const subId = typeof subRef === 'string' ? subRef : subRef.id

      const subRow = await db.query.subscription.findFirst({
        where: eq(schema.subscription.stripeSubscriptionId, subId),
      })
      if (!subRow) break

      await db
        .update(schema.subscription)
        .set({ status: 'past_due', updatedAt: new Date() })
        .where(eq(schema.subscription.stripeSubscriptionId, subId))

      const userRow = await db.query.user.findFirst({
        where: eq(schema.user.id, subRow.userId),
      })
      if (userRow) {
        // fire-and-forget — email failure must not cause Stripe to retry the webhook
        sendPaymentFailedEmail(userRow.email, serverEnv.APP_URL).catch((err) =>
          console.error('[billing] payment-failed email error', err),
        )
      }
      break
    }
  }
}

type UpsertSubscriptionParams = {
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string | null
  stripeCurrentPeriodEnd: Date
  status: SubscriptionStatus
}

async function upsertSubscription(params: UpsertSubscriptionParams) {
  const existing = await db.query.subscription.findFirst({
    where: eq(schema.subscription.userId, params.userId),
  })

  if (existing) {
    await db
      .update(schema.subscription)
      .set({
        stripeCustomerId: params.stripeCustomerId,
        stripeSubscriptionId: params.stripeSubscriptionId,
        stripePriceId: params.stripePriceId,
        stripeCurrentPeriodEnd: params.stripeCurrentPeriodEnd,
        status: params.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscription.userId, params.userId))
  } else {
    await db.insert(schema.subscription).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripePriceId: params.stripePriceId,
      stripeCurrentPeriodEnd: params.stripeCurrentPeriodEnd,
      status: params.status,
    })
  }
}
