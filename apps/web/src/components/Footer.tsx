import { Footer as UIFooter } from "@vanta-base-admin/ui";
import { NewsletterForm } from "./NewsletterForm";

const groups = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Customers", href: "/customers" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Security", href: "/security" },
      { label: "TODO: Contact", href: "mailto:TODO@example.com" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "TODO: Docs", href: "/docs" },
      { label: "RSS", href: "/rss.xml" },
      { label: "Releases", href: "/releases" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Refund Policy", href: "/refund" },
      { label: "DPA", href: "/dpa" },
    ],
  },
];

export default function Footer() {
  return (
    <UIFooter
      brand={{
        name: "Vanta Base Admin",
        tagline: "Ship paid SaaS faster, without lock-in.",
        href: "/",
      }}
      groups={groups}
      newsletter={<NewsletterForm />}
    />
  );
}
