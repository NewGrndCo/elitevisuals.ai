import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { siteDescription, siteOrigin, siteTitle, socialImage } from "@/lib-next/site-metadata";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: siteTitle, template: "%s | EliteVisuals.ai" },
  description: siteDescription,
  applicationName: "EliteVisuals.ai",
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/icon.png" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "EliteVisuals.ai",
    locale: "en_US",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "EliteVisuals.ai — Create Beyond Ordinary. AI prompts, skills and creator resources.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [socialImage],
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
