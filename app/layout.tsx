import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
export const metadata: Metadata = {
  title: { default: "Elite Visuals — AI Prompt Library", template: "%s — Elite Visuals" },
  description: "Curated AI prompt packs, visual workflows, and downloadable creative skills.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
