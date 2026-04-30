import { useQuery, useMutation } from '@tanstack/react-query'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@praxor-kit/ui'
import { env } from '../../lib/env'

type Subscription = {
  id: string
  status: string
  stripePriceId: string | null
  stripeCurrentPeriodEnd: string | null
}

async function fetchSubscription(): Promise<{ subscription: Subscription | null }> {
  const res = await fetch(`${env.VITE_API_URL}/billing/subscription`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch subscription')
  return res.json()
}

async function createPortalSession(): Promise<{ url: string }> {
  const res = await fetch(`${env.VITE_API_URL}/billing/portal`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnUrl: window.location.href }),
  })
  if (!res.ok) throw new Error('Failed to create portal session')
  return res.json()
}

async function createCheckoutSession(priceId: string): Promise<{ url: string | null }> {
  const res = await fetch(`${env.VITE_API_URL}/billing/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId,
      successUrl: `${window.location.origin}/dashboard/billing?checkout=success`,
      cancelUrl: window.location.href,
    }),
  })
  if (!res.ok) throw new Error('Failed to create checkout session')
  return res.json()
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
  })

  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: ({ url }) => { window.location.href = url },
  })

  const checkoutMutation = useMutation({
    mutationFn: (priceId: string) => createCheckoutSession(priceId),
    onSuccess: ({ url }) => { if (url) window.location.href = url },
  })

  const subscription = data?.subscription
  const isActive = subscription && ['active', 'trialing'].includes(subscription.status)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and payment details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
          <CardDescription>
            {isLoading
              ? 'Loading…'
              : isActive
                ? `${formatStatus(subscription.status)} subscription`
                : 'No active subscription'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription?.stripeCurrentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Renews {formatDate(subscription.stripeCurrentPeriodEnd)}
            </p>
          )}

          {isActive ? (
            <Button
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? 'Redirecting…' : 'Manage subscription'}
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Upgrade to unlock all features.
              </p>
              {/* TODO: replace price ID with your actual Stripe price ID */}
              <Button
                onClick={() => checkoutMutation.mutate('TODO_REPLACE_PRICE_ID')}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? 'Redirecting…' : 'Upgrade to Pro'}
              </Button>
            </div>
          )}

          {(portalMutation.isError || checkoutMutation.isError) && (
            <p className="text-sm text-destructive">
              {portalMutation.error?.message ?? checkoutMutation.error?.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
