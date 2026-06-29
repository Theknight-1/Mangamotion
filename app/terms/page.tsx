import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — MotionRecap",
  description: "Terms of Service for MotionRecap",
  robots: { index: false, follow: false },
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f7f3ea] px-6 py-20">
      <div className="mx-auto max-w-180">
        <Link
          href="/"
          className="mb-10 inline-block text-sm text-[rgba(31,46,26,0.5)] hover:text-[#1f2e1a]"
        >
          ← Back to home
        </Link>

        <h1 className="mb-2 text-[32px] font-bold text-[#1f2e1a]">
          Terms of Service
        </h1>
        <p className="mb-12 text-sm text-[rgba(31,46,26,0.5)]">
          Last updated: June 22, 2026
        </p>

        <div className="space-y-10 text-[15px] leading-7 text-[#3a3325]">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              1. Who we are
            </h2>
            <p>
              MotionRecap ("we," "us," "our") provides a web-based service that
              converts manga panel images into narrated, animated video recaps
              ("the Service"). These Terms govern your access to and use of the
              Service at [your domain]. By creating an account or using the
              Service, you agree to these Terms.
            </p>
            <p className="mt-3 text-sm text-[rgba(31,46,26,0.55)]">
              [Legal entity name and registered address to be added once
              incorporated.]
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              2. Eligibility
            </h2>
            <p>
              You must be at least 18 years old, or the age of legal majority in
              your jurisdiction, to create an account. By using the Service you
              confirm you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              3. Your content and rights
            </h2>
            <p>
              You retain ownership of the manga images, panels, and other source
              material you upload ("Source Content"). By uploading Source
              Content, you confirm that you either own the rights to it or have
              the necessary permissions or license to use it, and to generate
              derivative video content from it through the Service.
            </p>
            <p className="mt-3">
              You are solely responsible for ensuring your use of any
              copyrighted manga, comic, or illustrated material complies with
              applicable copyright law in your jurisdiction, including fair use,
              fair dealing, or equivalent exceptions where they apply.
              MotionRecap does not review uploaded content for copyright
              clearance and disclaims responsibility for infringing use by
              account holders.
            </p>
            <p className="mt-3">
              You grant us a limited license to process, store, and transmit
              your Source Content and the videos generated from it solely for
              the purpose of operating and providing the Service to you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              4. Generated content
            </h2>
            <p>
              Videos, narration text, and voice audio generated through the
              Service are produced using third-party AI models (including Google
              Gemini for panel analysis and narration, and CVoice AI for voice
              synthesis). We do not guarantee the accuracy, originality, or
              appropriateness of AI-generated narration or voice output, and you
              are responsible for reviewing generated content before publishing
              it publicly.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              5. Subscription plans and billing
            </h2>
            <p>The Service is offered under the following tiers:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Free — limited videos and render minutes per month</li>
              <li>Pro — paid monthly subscription with higher limits</li>
              <li>Premium — paid monthly subscription with unlimited usage</li>
            </ul>
            <p className="mt-3">
              Paid subscriptions are billed in advance on a recurring basis
              through Razorpay or PayPal, depending on your selected payment
              method and region. Subscriptions automatically renew unless
              cancelled before the next billing date. Fees are non-refundable
              except where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              6. Acceptable use
            </h2>
            <p>You agree not to use the Service to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>
                Upload content you do not have the rights or permission to use
              </li>
              <li>
                Generate or distribute content that is unlawful, defamatory,
                obscene, or infringing
              </li>
              <li>
                Attempt to reverse-engineer, scrape, or abuse the Service's AI
                processing or voice synthesis infrastructure
              </li>
              <li>
                Circumvent usage limits, subscription tiers, or rate limits
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              7. Termination
            </h2>
            <p>
              We may suspend or terminate accounts that violate these Terms. You
              may cancel your subscription and delete your account at any time
              from your account settings. Upon deletion, your uploaded content
              and generated videos will be removed from our storage within a
              reasonable period.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              8. Disclaimers and limitation of liability
            </h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We
              do not guarantee uninterrupted availability, error-free rendering,
              or particular video output quality. To the maximum extent
              permitted by law, MotionRecap is not liable for indirect,
              incidental, or consequential damages arising from your use of the
              Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              9. Changes to these Terms
            </h2>
            <p>
              We may update these Terms from time to time. Material changes will
              be communicated via email or an in-app notice. Continued use of
              the Service after changes take effect constitutes acceptance of
              the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              10. Governing law
            </h2>
            <p>
              These Terms are governed by the laws of India, without regard to
              conflict-of-law principles. Any disputes will be subject to the
              exclusive jurisdiction of the courts located in [your city],
              India.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              11. Contact
            </h2>
            <p>
              Questions about these Terms can be sent to{" "}
              <a
                href="mailto:support@yourdomain.com"
                className="text-[#1f2e1a] underline"
              >
                support@yourdomain.com
              </a>{" "}
              or via our{" "}
              <Link href="/contact" className="text-[#1f2e1a] underline">
                contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
