export interface MarketingPage {
  slug: string;
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  inSitemap?: boolean;
}

export const MARKETING_PAGES: MarketingPage[] = [
  {
    slug: "home",
    path: "/",
    title: "Praxor Kit — Ship paid SaaS faster, without lock-in",
    description:
      "TODO: Your marketing site description. Make it compelling and include your key value proposition.",
  },
  {
    slug: "pricing",
    path: "/pricing",
    title: "Pricing — Praxor Kit",
    description: "TODO: Pricing page description. Mention your free tier and key plan benefits.",
    ogDescription: "Simple, transparent pricing for every stage.",
  },
  {
    slug: "blog",
    path: "/blog",
    title: "Blog — Praxor Kit",
    description: "Insights, updates, and tutorials from the Praxor Kit team.",
  },
  {
    slug: "faq",
    path: "/faq",
    title: "FAQ — Praxor Kit",
    description: "TODO: Frequently asked questions about Praxor Kit.",
  },
  {
    slug: "customers",
    path: "/customers",
    title: "Customers — Praxor Kit",
    description: "TODO: Stories and testimonials from teams using Praxor Kit.",
  },
  {
    slug: "terms",
    path: "/terms",
    title: "Terms of Service — Praxor Kit",
    description: "Terms of Service for Praxor Kit.",
  },
  {
    slug: "privacy",
    path: "/privacy",
    title: "Privacy Policy — Praxor Kit",
    description: "Privacy Policy for Praxor Kit.",
  },
  {
    slug: "cookies",
    path: "/cookies",
    title: "Cookie Policy — Praxor Kit",
    description: "Cookie Policy for Praxor Kit.",
  },
  {
    slug: "refund",
    path: "/refund",
    title: "Refund Policy — Praxor Kit",
    description: "Refund Policy for Praxor Kit.",
  },
  {
    slug: "dpa",
    path: "/dpa",
    title: "Data Processing Agreement — Praxor Kit",
    description: "Data Processing Agreement for Praxor Kit.",
  },
  {
    slug: "security",
    path: "/security",
    title: "Security — Praxor Kit",
    description: "TODO: How Praxor Kit keeps your data safe.",
  },
];

export function getPageBySlug(slug: string): MarketingPage | undefined {
  return MARKETING_PAGES.find((p) => p.slug === slug);
}

export function getPageByPath(path: string): MarketingPage | undefined {
  return MARKETING_PAGES.find((p) => p.path === path);
}

/** Like getPageBySlug but throws at runtime if the slug is not in MARKETING_PAGES. */
export function requirePage(slug: string): MarketingPage {
  const page = getPageBySlug(slug);
  if (!page) {
    throw new Error(`[pages] slug "${slug}" not found in MARKETING_PAGES`);
  }
  return page;
}
