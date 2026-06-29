import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — MotionRecap",
  description: "Privacy Policy for MotionRecap",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f7f3ea] px-6 py-20">
      <div className="mx-auto max-w-[720px]">
        <Link
          href="/"
          className="mb-10 inline-block text-sm text-[rgba(31,46,26,0.5)] hover:text-[#1f2e1a]"
        >
          ← Back to home
        </Link>

        <h1 className="mb-2 text-[32px] font-bold text-[#1f2e1a]">
          Privacy Policy
        </h1>
        <p className="mb-12 text-sm text-[rgba(31,46,26,0.5)]">
          Last updated: June 22, 2026
        </p>

        <div className="space-y-10 text-[15px] leading-7 text-[#3a3325]">
          <section>
            <p>
              This Privacy Policy explains what information MotionRecap
              collects, how we use it, and the choices you have. By using the
              Service, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              1. Information we collect
            </h2>
            <p className="mb-2 font-medium text-[#1f2e1a]">
              Account information
            </p>
            <p>
              Name, email address, and authentication credentials when you sign
              up, managed through Better Auth. If you sign in via a third-party
              provider (Google or GitHub), we receive basic profile information
              from that provider.
            </p>
            <p className="mt-4 mb-2 font-medium text-[#1f2e1a]">
              Content you upload
            </p>
            <p>
              Manga panel images you upload, stored via Vercel Blob, along with
              the narration text, voice audio, and rendered videos generated
              from them.
            </p>
            <p className="mt-4 mb-2 font-medium text-[#1f2e1a]">
              Payment information
            </p>
            <p>
              If you subscribe to a paid plan, payment processing is handled
              directly by Razorpay or PayPal. We do not store your full payment
              card details — we receive only transaction confirmations and
              subscription status from these providers.
            </p>
            <p className="mt-4 mb-2 font-medium text-[#1f2e1a]">Usage data</p>
            <p>
              Information about how you use the Service — projects created,
              render activity, and feature usage — to operate and improve the
              product.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              2. How we use your information
            </h2>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                To provide and operate the Service, including video rendering
              </li>
              <li>To process payments and manage subscriptions</li>
              <li>To send account-related and service-related emails</li>
              <li>To monitor for abuse and enforce our Terms of Service</li>
              <li>To improve the product based on aggregate usage patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              3. Third-party processors
            </h2>
            <p>
              We share data with the following categories of third-party
              services strictly to operate the Service:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>
                <span className="font-medium text-[#1f2e1a]">
                  Neon (PostgreSQL)
                </span>{" "}
                — primary database hosting
              </li>
              <li>
                <span className="font-medium text-[#1f2e1a]">Vercel Blob</span>{" "}
                — storage for uploaded images and rendered videos
              </li>
              <li>
                <span className="font-medium text-[#1f2e1a]">
                  Google Gemini
                </span>{" "}
                — AI analysis of uploaded panels and narration generation.
                Uploaded panel images are sent to Gemini's API for this
                processing.
              </li>
              <li>
                <span className="font-medium text-[#1f2e1a]">CVoice AI</span> —
                voice synthesis. Generated narration text is sent to CVoice's
                API to produce character voice audio.
              </li>
              <li>
                <span className="font-medium text-[#1f2e1a]">
                  Razorpay & PayPal
                </span>{" "}
                — payment processing for paid subscriptions
              </li>
            </ul>
            <p className="mt-3">
              Each of these providers processes data under their own privacy
              policies and security practices. We select providers that maintain
              industry-standard data protection practices, but we encourage you
              to review their respective policies if you have specific concerns.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              4. Data retention
            </h2>
            <p>
              We retain your account data and uploaded content for as long as
              your account remains active. If you delete your account, we will
              delete your uploaded images, generated videos, and associated
              project data within a reasonable period, except where retention is
              required for legal, billing, or fraud prevention purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              5. Your rights
            </h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:privacy@yourdomain.com"
                className="text-[#1f2e1a] underline"
              >
                privacy@yourdomain.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              6. International data transfers
            </h2>
            <p>
              Because our infrastructure providers (Neon, Vercel, Google, CVoice
              AI) operate globally, your data may be processed in countries
              outside your country of residence, including the United States. We
              rely on these providers' own compliance mechanisms for
              cross-border data transfers.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              7. Cookies
            </h2>
            <p>
              We use essential cookies for authentication and session management
              (via Better Auth). We do not currently use third-party advertising
              or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              8. Children's privacy
            </h2>
            <p>
              The Service is not directed at individuals under 18. We do not
              knowingly collect personal data from children.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              9. Changes to this policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Material
              changes will be communicated via email or an in-app notice before
              they take effect.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#1f2e1a]">
              10. Contact
            </h2>
            <p>
              For privacy-related questions, reach us at{" "}
              <a
                href="mailto:privacy@yourdomain.com"
                className="text-[#1f2e1a] underline"
              >
                privacy@yourdomain.com
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
