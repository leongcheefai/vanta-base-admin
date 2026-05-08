import { PricingCard } from "@praxor-kit/ui";
import { useEffect, useState } from "react";

const FREE_TIER = {
  name: "Free",
  price: "$0",
  period: "/month",
  description: "TODO: Perfect for getting started and exploring.",
  features: [
    "TODO: Core feature 1",
    "TODO: Core feature 2",
    "TODO: Core feature 3",
    "TODO: Core feature 4",
  ],
  cta: { label: "Get started free", href: "/signup" },
};

const ENTERPRISE_TIER = {
  name: "Enterprise",
  price: "Custom",
  period: "",
  description: "TODO: For large teams with advanced security and compliance needs.",
  features: [
    "Everything in Pro",
    "TODO: Enterprise feature 1",
    "TODO: Enterprise feature 2",
    "SSO / SAML",
    "Dedicated support",
    "SLA guarantee",
  ],
  cta: { label: "Contact sales", href: "mailto:TODO@praxor.dev" },
};

export function PricingContent() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [config, setConfig] = useState<{
    proMonthlyPriceId: string | null;
    proYearlyPriceId: string | null;
  } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const apiUrl =
      (import.meta.env.PUBLIC_API_URL as string | undefined) ?? "http://localhost:3001";

    // Fetch billing config
    fetch(`${apiUrl}/billing/config`)
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => {
        /* non-critical */
      });

    // Detect login
    fetch(`${apiUrl}/me`, { credentials: "include" })
      .then((r) => {
        if (r.ok) setIsLoggedIn(true);
      })
      .catch(() => {
        /* non-critical */
      });
  }, []);

  const selectedProPriceId =
    billingCycle === "monthly" ? config?.proMonthlyPriceId : config?.proYearlyPriceId;

  const proCtaHref = `/signup?plan=pro&billing=${billingCycle}`;

  async function handleProCtaClick(e: React.MouseEvent) {
    if (isLoggedIn && selectedProPriceId) {
      e.preventDefault();
      const apiUrl =
        (import.meta.env.PUBLIC_API_URL as string | undefined) ?? "http://localhost:3001";
      try {
        const res = await fetch(`${apiUrl}/billing/checkout`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId: selectedProPriceId,
            successUrl: `${window.location.origin}/dashboard/billing?checkout=success`,
            cancelUrl: window.location.href,
          }),
        });
        if (!res.ok) throw new Error("checkout failed");
        const { url } = (await res.json()) as { url: string | null };
        if (url) window.location.href = url;
      } catch {
        window.location.href = proCtaHref; // fallback
      }
    }
    // If not logged in or no priceId: let the <a> navigate to proCtaHref normally
  }

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

        {/* Billing cycle toggle */}
        <div className="flex justify-center mb-8 mt-8">
          <div className="inline-flex rounded-lg border border-border p-1 bg-background">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                billingCycle === "yearly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <PricingCard {...FREE_TIER} />

          {/* Pro tier — wrapped to intercept CTA click for logged-in checkout */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: click handler on interactive card wrapper */}
          <div onClick={handleProCtaClick}>
            <PricingCard
              name="Pro"
              price="$TODO"
              period="/month"
              description="TODO: For growing teams and serious projects."
              badge="Most popular"
              highlighted={true}
              features={[
                "Everything in Free",
                "TODO: Pro feature 1",
                "TODO: Pro feature 2",
                "TODO: Pro feature 3",
                "TODO: Pro feature 4",
                "Priority support",
              ]}
              cta={{ label: "Start free trial", href: proCtaHref }}
            />
          </div>

          <PricingCard {...ENTERPRISE_TIER} />
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </div>
  );
}
