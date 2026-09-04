import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
export const metadata: Metadata = {
  metadataBase: new URL("https://elitevisuals.ai"),
  title: { default: "EliteVisuals.ai | AI Creator Toolkit", template: "%s | EliteVisuals.ai" },
  description: "Curated AI prompt packs, visual workflows, and downloadable creative skills.",
  icons: { icon: "/icon.png", shortcut: "/icon.png", apple: "/icon.png" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "EliteVisuals.ai",
    title: "EliteVisuals.ai | AI Creator Toolkit",
    description: "Prompts, downloadable skills and creator resources for better AI visuals.",
    images: [{ url: "/social-preview.png", width: 1200, height: 630, alt: "EliteVisuals.ai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "EliteVisuals.ai | AI Creator Toolkit",
    description: "Prompts, downloadable skills and creator resources for better AI visuals.",
    images: ["/social-preview.png"],
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
