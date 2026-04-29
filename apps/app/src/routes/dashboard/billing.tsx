import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@praxor-kit/ui'

export function BillingPage() {
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
            {/* TODO: render actual plan name from subscriptions table */}
            No active subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: wire up Stripe Customer Portal in Phase 8 */}
          <Button variant="outline" disabled>
            Manage subscription
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Stripe billing will be wired in Phase 8.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
