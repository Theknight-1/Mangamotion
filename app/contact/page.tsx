import Link from "next/link";

export const metadata = {
  title: "Contact — MangaMotion",
  description: "Get in touch with the MangaMotion team",
};

const SOCIALS = [
  { label: "Twitter / X", href: "https://twitter.com/yourhandle" },
  { label: "Discord", href: "https://discord.gg/yourinvite" },
  { label: "GitHub", href: "https://github.com/Theknight-1/Mangamotion" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#f7f3ea] px-6 py-20">
      <div className="mx-auto max-w-[560px]">
        <Link
          href="/"
          className="mb-10 inline-block text-sm text-[rgba(31,46,26,0.5)] hover:text-[#1f2e1a]"
        >
          ← Back to home
        </Link>

        <h1 className="mb-3 text-[32px] font-bold text-[#1f2e1a]">
          Get in touch
        </h1>
        <p className="mb-12 text-[15px] leading-7 text-[rgba(31,46,26,0.6)]">
          Questions about your account, billing, or just want to talk about your
          manga recap channel? Reach us directly — we read every message.
        </p>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[#e2dcc9] bg-white p-6">
            <p className="mb-1 text-[12.5px] font-medium uppercase tracking-wide text-[rgba(31,46,26,0.5)]">
              General support
            </p>
            <a
              href="mailto:support@yourdomain.com"
              className="text-lg font-semibold text-[#1f2e1a] hover:underline"
            >
              support@yourdomain.com
            </a>
            <p className="mt-2 text-sm text-[rgba(31,46,26,0.55)]">
              Account issues, billing questions, bug reports.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2dcc9] bg-white p-6">
            <p className="mb-1 text-[12.5px] font-medium uppercase tracking-wide text-[rgba(31,46,26,0.5)]">
              Privacy & data requests
            </p>
            <a
              href="mailto:privacy@yourdomain.com"
              className="text-lg font-semibold text-[#1f2e1a] hover:underline"
            >
              privacy@yourdomain.com
            </a>
            <p className="mt-2 text-sm text-[rgba(31,46,26,0.55)]">
              Data access, correction, or deletion requests.
            </p>
          </div>

          <div className="rounded-2xl border border-[#e2dcc9] bg-white p-6">
            <p className="mb-3 text-[12.5px] font-medium uppercase tracking-wide text-[rgba(31,46,26,0.5)]">
              Find us elsewhere
            </p>
            <div className="flex flex-wrap gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[#e2dcc9] px-3.5 py-2 text-sm font-medium text-[#1f2e1a] transition-colors hover:bg-[#faf8f2]"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
