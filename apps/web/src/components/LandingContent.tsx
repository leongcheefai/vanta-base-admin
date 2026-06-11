import {
  Container,
  FAQ,
  FeatureSection,
  Hero,
  LogoCloud,
  Section,
  SectionHeader,
  Testimonial,
} from "@vanta-base-admin/ui";

const APP_URL = (import.meta.env.PUBLIC_APP_URL as string | undefined) ?? "http://localhost:3000";

const features = [
  { title: "TODO: Feature 1", description: "TODO: Describe this feature in one or two sentences." },
  { title: "TODO: Feature 2", description: "TODO: Describe this feature in one or two sentences." },
  { title: "TODO: Feature 3", description: "TODO: Describe this feature in one or two sentences." },
  { title: "TODO: Feature 4", description: "TODO: Describe this feature in one or two sentences." },
  { title: "TODO: Feature 5", description: "TODO: Describe this feature in one or two sentences." },
  { title: "TODO: Feature 6", description: "TODO: Describe this feature in one or two sentences." },
];

const testimonials = [
  {
    quote: "TODO: This is where a customer testimonial goes. It should be genuine and specific.",
    author: "TODO: Full Name",
    role: "TODO: Title, Company",
  },
  {
    quote: "TODO: Another testimonial from a satisfied customer.",
    author: "TODO: Full Name",
    role: "TODO: Title, Company",
  },
  {
    quote: "TODO: A third testimonial highlighting a different benefit.",
    author: "TODO: Full Name",
    role: "TODO: Title, Company",
  },
];

const faqItems = [
  {
    question: "TODO: First frequently asked question?",
    answer: "TODO: Answer to the first question.",
  },
  {
    question: "TODO: Second frequently asked question?",
    answer: "TODO: Answer to the second question.",
  },
  {
    question: "TODO: Third frequently asked question?",
    answer: "TODO: Answer to the third question.",
  },
  {
    question: "TODO: Fourth frequently asked question?",
    answer: "TODO: Answer to the fourth question.",
  },
  {
    question: "TODO: Fifth frequently asked question?",
    answer: "TODO: Answer to the fifth question.",
  },
];

export function LandingContent() {
  return (
    <>
      <Hero
        badge="TODO: Badge text"
        headline="TODO: Your main headline goes here"
        subheadline="TODO: Supporting subheadline that explains your value proposition in two sentences."
        primaryCta={{ label: "Get started free", href: `${APP_URL}/signup` }}
        secondaryCta={{ label: "See the demo", href: "#features" }}
      />

      <LogoCloud
        label="TODO: Trusted by teams at"
        logos={[
          { name: "Company A" },
          { name: "Company B" },
          { name: "Company C" },
          { name: "Company D" },
          { name: "Company E" },
        ]}
      />

      <div id="features">
        <FeatureSection
          eyebrow="Features"
          headline="TODO: Everything you need to ship"
          subheadline="TODO: Brief description of the feature section."
          features={features}
        />
      </div>

      <Section>
        <Container>
          <SectionHeader headline="TODO: What your customers say" />
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Testimonial key={t.quote} quote={t.quote} author={t.author} role={t.role} />
            ))}
          </div>
        </Container>
      </Section>

      <FAQ eyebrow="FAQ" headline="Common questions" items={faqItems} />
    </>
  );
}
