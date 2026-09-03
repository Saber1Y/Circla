import type { Metadata } from "next";
import { Newsreader, Sora, Inter } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CIRCLA — Chat-Native Equity Syndicates",
  description:
    "Pool USDC with friends, automate stock investments, and manage fractional portfolios of US equities — directly inside Telegram.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${sora.variable} ${inter.variable}`}>
      <body className="bg-[#f5f3ee] font-sans text-[#101114] antialiased">{children}</body>
    </html>
  );
}
