import { Check, Mail, Users, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - ShimGIS",
  description: "Simple, transparent pricing for individuals and teams",
};

interface Tier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlight?: boolean;
  icon: React.ElementType;
}

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    description: "For individuals getting started with web GIS",
    icon: Zap,
    features: [
      "3 projects, 10 layers",
      "Feature editing & drawing tools",
      "Data import (GeoJSON, Shapefile, KML, CSV)",
      "Geocoding & routing",
      "Export (PNG, GeoJSON, CSV)",
      "50 MB storage",
    ],
    cta: "Get Started Free",
    ctaHref: "/sign-up",
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For professionals who need advanced GIS tools",
    icon: Zap,
    highlight: true,
    features: [
      "Everything in Free",
      "Unlimited projects & layers",
      "Spatial analysis (buffer, intersect, union)",
      "Advanced visualization & deck.gl",
      "Satellite imagery sources",
      "GeoAI / ML inference",
      "Visual workflow builder",
      "Scripting console (Monaco)",
      "Dashboard builder",
      "5 GB storage",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    ctaHref: "/sign-up?plan=pro",
  },
  {
    name: "Team",
    price: "$19",
    period: "/seat/mo",
    description: "For teams collaborating on geospatial projects",
    icon: Users,
    features: [
      "Everything in Pro",
      "Shared organization workspace",
      "Role-based access (admin/editor/viewer)",
      "50 GB shared org storage",
      "Audit log & activity feed",
      "Minimum 3 seats",
    ],
    cta: "Start Team Trial",
    ctaHref: "/sign-up?plan=team",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations with advanced security & scale needs",
    icon: Mail,
    features: [
      "Everything in Team",
      "SSO / SAML authentication",
      "Unlimited storage",
      "99.9% uptime SLA",
      "Dedicated customer success manager",
      "Custom integrations & API access",
      "On-premises deployment option",
    ],
    cta: "Contact Sales",
    ctaHref: "mailto:sales@shimgis.com",
  },
];

const FAQ = [
  {
    q: "Can I try ShimGIS without creating an account?",
    a: "Yes. You can open the map, import small files, draw features, and use geocoding without signing up. Your work is saved locally in your browser. Sign up free to save projects to the cloud.",
  },
  {
    q: "What happens when I hit my plan limits?",
    a: "You'll see a clear message explaining the limit and an option to upgrade. Your existing data is never deleted — you just can't create new resources beyond the limit until you upgrade.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrades take effect immediately. Downgrades take effect at the end of your billing period. Your data is preserved when you downgrade.",
  },
  {
    q: "How does Team billing work?",
    a: "Team plans are billed per seat per month, with a minimum of 3 seats. You can add or remove seats at any time, and billing is prorated.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes. Annual billing saves ~17% — Pro is $24/mo billed annually, and Team is $15/seat/mo billed annually.",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
          Start free. Upgrade when you need more power. No hidden fees, no
          credit card required to start.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col rounded-xl p-6 ${
              tier.highlight
                ? "border-2 border-primary/30 bg-primary/5 shadow-lg"
                : "border"
            }`}
          >
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">{tier.name}</h3>
                {tier.highlight && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                    Most Popular
                  </span>
                )}
              </div>
              <p className="mt-2 text-3xl font-bold">
                {tier.price}
                {tier.period && (
                  <span className="text-sm font-normal text-muted-foreground">
                    {tier.period}
                  </span>
                )}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {tier.description}
              </p>
            </div>

            <ul className="flex-1 space-y-2.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                      tier.highlight ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href={tier.ctaHref}
              className={`mt-6 flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                tier.highlight
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border bg-background hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <tier.icon className="h-4 w-4" />
              {tier.cta}
            </a>
          </div>
        ))}
      </div>

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center text-xl font-semibold">
          Frequently asked questions
        </h2>
        <div className="mt-8 divide-y">
          {FAQ.map((item) => (
            <div key={item.q} className="py-5">
              <h3 className="text-sm font-semibold">{item.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
