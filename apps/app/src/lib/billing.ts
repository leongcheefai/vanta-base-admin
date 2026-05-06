import { useQuery } from '@tanstack/react-query'
import { env } from './env'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'

export interface Subscription {
  id: string
  status: SubscriptionStatus
  stripePriceId: string | null
  stripeCurrentPeriodEnd: string | null
}

export interface SubscriptionResponse {
  subscription: Subscription | null
}

export async function fetchSubscription(): Promise<SubscriptionResponse> {
  const res = await fetch(`${env.VITE_API_URL}/billing/subscription`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch subscription')
  return res.json()
}

export function useSubscription() {
  const query = useQuery({ queryKey: ['subscription'], queryFn: fetchSubscription })
  const subscription = query.data?.subscription ?? null
  const isPro = !!subscription && ['active', 'trialing'].includes(subscription.status)
  return { ...query, subscription, isPro }
}
