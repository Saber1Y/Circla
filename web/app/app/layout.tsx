import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "./providers";

export const metadata: Metadata = {
  title: "CIRCLA — Telegram Mini App",
  description:
    "Pool USDC with friends, vote on Coinbase tokenized-stock purchases, and track the vault onchain.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}