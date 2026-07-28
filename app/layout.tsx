import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Roboto_Mono, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: process.env.SITE_URL
    ? new URL(process.env.SITE_URL)
    : undefined,
  title: {
    default: "MotionRecap — Turn manga panels into narrated videos",
    template: "%s — MotionRecap",
  },
  description:
    "Upload manga panels and let AI generate narration, character voices, and a cinematic 9:16 video in minutes. Built for YouTube Shorts and TikTok manga recap creators.",
  keywords: [
    "manga recap video maker",
    "manga to video AI",
    "manga animation tool",
    "anime recap generator",
    "AI voice manga",
    "manga panel to video",
    "youtube shorts manga tool",
  ],
  authors: [{ name: "MotionRecap" }],
  creator: "MotionRecap",
  publisher: "MotionRecap",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.SITE_URL,
    siteName: "MotionRecap",
    title: "MotionRecap — Turn manga panels into narrated videos",
    description:
      "Upload manga panels and let AI generate narration, character voices, and a cinematic video in minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MotionRecap — manga panels to animated video",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MotionRecap — Turn manga panels into narrated videos",
    description:
      "Upload manga panels and let AI generate narration, character voices, and a cinematic video in minutes.",
    images: ["/og-image.png"],
    creator: "@yourhandle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${bricolage.variable}`}>
      <body className="font-sans antialiased bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-XJBVFPSTCC"
        ></script>
        <script>
          {`
    window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XJBVFPSTCC');
  `}
        </script>
        {children}
        <Toaster position="bottom-right" />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
