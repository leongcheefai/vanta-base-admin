import { PricingCard } from '@praxor-kit/ui'

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'TODO: Perfect for getting started and exploring.',
    features: [
      'TODO: Core feature 1',
      'TODO: Core feature 2',
      'TODO: Core feature 3',
      'TODO: Core feature 4',
    ],
    cta: { label: 'Get started free', href: '/signup' },
  },
  {
    name: 'Pro',
    price: '$TODO',
    period: '/month',
    description: 'TODO: For growing teams and serious projects.',
    badge: 'Most popular',
    highlighted: true as const,
    features: [
      'Everything in Free',
      'TODO: Pro feature 1',
      'TODO: Pro feature 2',
      'TODO: Pro feature 3',
      'TODO: Pro feature 4',
      'Priority support',
    ],
    cta: { label: 'Start free trial', href: '/signup?plan=pro' },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'TODO: For large teams with advanced security and compliance needs.',
    features: [
      'Everything in Pro',
      'TODO: Enterprise feature 1',
      'TODO: Enterprise feature 2',
      'SSO / SAML',
      'Dedicated support',
      'SLA guarantee',
    ],
    cta: { label: 'Contact sales', href: 'mailto:TODO@praxor.dev' },
  },
]

export function PricingContent() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            TODO: Supporting text for your pricing page. No hidden fees.
          </p>
        </div>
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </div>
  )
}
