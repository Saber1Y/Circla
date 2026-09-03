import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CIRCLA — Group equity on Base",
  description: "Private investment circles on Base. Pool USDC, vote on Coinbase Tokenized Stocks, own the outcome.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
