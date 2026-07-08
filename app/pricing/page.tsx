import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import PricingPage from "@/components/pricing-page";
import { TIERS, type TierKey } from "@/lib/payment";
import { rolloverIfNeeded } from "../actions/subscription/usages";

// ── SEO metadata ────────────────────────────────────────────────
// `metadataBase` is already set globally in app/layout.tsx, so relative
// URLs below resolve correctly for OG/canonical.
export const metadata: Metadata = {
  title: "Pricing — MotionRecap | AI Manga Recap Video Generator",
  description:
    "Turn manga panels into narrated, animated 9:16 recap videos for YouTube Shorts and TikTok. Free plan available. Plans from $19/mo with no watermark, priority rendering, and 4K export.",
  keywords: [
    "manga recap video maker",
    "manga to video AI",
    "AI manga narration",
    "YouTube Shorts manga recap",
    "TikTok manga recap tool",
    "MotionRecap pricing",
  ],
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "MotionRecap Pricing — Free to Start, Plans from $19/mo",
    description:
      "Turn manga panels into narrated, animated recap videos in minutes. Compare Free, Creator, and Pro plans.",
    url: "/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MotionRecap Pricing — Free to Start, Plans from $19/mo",
    description:
      "Turn manga panels into narrated, animated recap videos in minutes. Compare Free, Creator, and Pro plans.",
  },
};

// ── Structured data ─────────────────────────────────────────────
// Product + Offers so pricing can surface in rich results, plus an FAQPage
// block for the billing questions people actually search for.
function buildJsonLd() {
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "MotionRecap",
    description:
      "SaaS platform that converts manga panel images into AI-narrated, animated 9:16 recap videos for YouTube Shorts and TikTok.",
    brand: {
      "@type": "Brand",
      name: "MotionRecap",
    },
    offers: (Object.keys(TIERS) as TierKey[]).map((key) => {
      const tier = TIERS[key];
      return {
        "@type": "Offer",
        name: `${tier.name} plan`,
        price: tier.price.toFixed(2),
        priceCurrency: "USD",
        description: tier.description,
        url: "https://motionrecap.com/pricing",
        availability: "https://schema.org/InStock",
        ...(tier.price > 0 && {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: tier.price.toFixed(2),
            priceCurrency: "USD",
            billingDuration: "P1M",
          },
        }),
      };
    }),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is there a free plan?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The Free plan includes 10 render minutes per month, all aspect ratios, 1080p export, and one AI voice, with a MotionRecap watermark on exported videos.",
        },
      },
      {
        "@type": "Question",
        name: "Can I cancel my subscription anytime?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can cancel at the end of your current billing period and keep access until then, or cancel immediately and switch back to the Free plan right away.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MotionRecap supports both Razorpay and PayPal for subscription billing.",
        },
      },
      {
        "@type": "Question",
        name: "What happens if I go over my render minutes?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Once you use up your monthly render minutes, new renders are paused until your plan renews or you upgrade to a higher tier.",
        },
      },
    ],
  };

  return [productLd, faqLd];
}

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  let currentTier: TierKey = "free";
  if (session?.user) {
    const sub = await rolloverIfNeeded(session.user.id);
    currentTier = sub.tier as TierKey;
  }

  const jsonLd = buildJsonLd();

  return (
    <>
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <PricingPage
        currentTier={currentTier}
        userEmail={session?.user?.email}
        userName={session?.user?.name ?? undefined}
      />
    </>
  );
}
