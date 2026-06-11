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
    title: "Vanta Base Admin — Ship paid SaaS faster, without lock-in",
    description:
      "TODO: Your marketing site description. Make it compelling and include your key value proposition.",
  },
  {
    slug: "pricing",
    path: "/pricing",
    title: "Pricing — Vanta Base Admin",
    description: "TODO: Pricing page description. Mention your free tier and key plan benefits.",
    ogDescription: "Simple, transparent pricing for every stage.",
  },
  {
    slug: "blog",
    path: "/blog",
    title: "Blog — Vanta Base Admin",
    description: "Insights, updates, and tutorials from the Vanta Base Admin team.",
  },
  {
    slug: "releases",
    path: "/releases",
    title: "Releases — Vanta Base Admin",
    description: "What's new in Vanta Base Admin. Release notes, improvements, and changelog.",
  },
  {
    slug: "faq",
    path: "/faq",
    title: "FAQ — Vanta Base Admin",
    description: "TODO: Frequently asked questions about Vanta Base Admin.",
  },
  {
    slug: "customers",
    path: "/customers",
    title: "Customers — Vanta Base Admin",
    description: "TODO: Stories and testimonials from teams using Vanta Base Admin.",
  },
  {
    slug: "terms",
    path: "/terms",
    title: "Terms of Service — Vanta Base Admin",
    description: "Terms of Service for Vanta Base Admin.",
  },
  {
    slug: "privacy",
    path: "/privacy",
    title: "Privacy Policy — Vanta Base Admin",
    description: "Privacy Policy for Vanta Base Admin.",
  },
  {
    slug: "cookies",
    path: "/cookies",
    title: "Cookie Policy — Vanta Base Admin",
    description: "Cookie Policy for Vanta Base Admin.",
  },
  {
    slug: "refund",
    path: "/refund",
    title: "Refund Policy — Vanta Base Admin",
    description: "Refund Policy for Vanta Base Admin.",
  },
  {
    slug: "dpa",
    path: "/dpa",
    title: "Data Processing Agreement — Vanta Base Admin",
    description: "Data Processing Agreement for Vanta Base Admin.",
  },
  {
    slug: "security",
    path: "/security",
    title: "Security — Vanta Base Admin",
    description: "TODO: How Vanta Base Admin keeps your data safe.",
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
