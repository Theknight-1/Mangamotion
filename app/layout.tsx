import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: process.env.SITE_URL
    ? new URL(process.env.SITE_URL)
    : undefined,
  title: {
    default: "MangaMotion — Turn manga panels into narrated videos",
    template: "%s — MangaMotion",
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
  authors: [{ name: "MangaMotion" }],
  creator: "MangaMotion",
  publisher: "MangaMotion",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.SITE_URL,
    siteName: "MangaMotion",
    title: "MangaMotion — Turn manga panels into narrated videos",
    description:
      "Upload manga panels and let AI generate narration, character voices, and a cinematic 9:16 video in minutes.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MangaMotion — manga panels to animated video",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MangaMotion — Turn manga panels into narrated videos",
    description:
      "Upload manga panels and let AI generate narration, character voices, and a cinematic 9:16 video in minutes.",
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
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
        {children}
        <Toaster position="bottom-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
