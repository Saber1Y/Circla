"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Users, LineChart, Smartphone, Play } from "lucide-react";
import { useTMA } from "@/hooks/useTMA";

const WorkflowDiagram = dynamic(() => import("@/components/WorkflowDiagram"), {
  ssr: false,
  loading: () => <div className="h-[360px] animate-pulse rounded-[24px] border border-[#e3dfd7] bg-white" aria-hidden />,
});
const SecurityDiagram = dynamic(() => import("@/components/SecurityDiagram"), {
  ssr: false,
  loading: () => <div className="h-[280px] animate-pulse rounded-[24px] border border-[#e3dfd7] bg-white" aria-hidden />,
});

const VAULT = process.env.NEXT_PUBLIC_CIRCLA_VAULT_ADDRESS || "";
const TG_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/CirclaBot";
const TG_APP_URL = process.env.NEXT_PUBLIC_TELEGRAM_APP_URL || TG_URL;
const LOOM_URL = process.env.NEXT_PUBLIC_LOOM_URL || "";
const EXPLORER = "https://sepolia.basescan.org";
const vaultLink = VAULT ? `${EXPLORER}/address/${VAULT}` : "#";
const isLive = Boolean(VAULT && VAULT.startsWith("0x"));

export default function Landing() {
  const { isTMA } = useTMA();
  const reduceMotion = useReducedMotion();
  const anim = (delay = 0) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.6 } };
  const inView = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true },
          transition: { delay },
        };

  return (
    <main className="mx-auto max-w-[1240px] px-7 py-6 max-md:px-4">
      <header className="flex items-center justify-between gap-4">
        <a
          href="/"
          className="font-[var(--font-newsreader)] text-[17px] font-medium tracking-tight text-[#101114]"
        >
          CIRCLA
          <span className="ml-1 font-[var(--font-sora)] text-[11px] font-bold tracking-widest text-[#0052FF]">
            /BASE
          </span>
        </a>
        <nav className="ml-auto hidden items-center gap-5 md:flex">
          <a href="#demo" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            Demo
          </a>
          <a href="#how" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            How it works
          </a>
          <a href="#app" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            Web app
          </a>
          <a
            href={vaultLink}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#77736c] hover:text-[#101114]"
          >
            Vault ↗
          </a>
        </nav>
        <Link
          href="/app"
          className="hidden rounded-full border border-[#e3dfd7] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#101114] hover:bg-[#f5f3ee] md:inline-flex"
        >
          Open Web Dashboard
        </Link>
        <a
          href={TG_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#101114] px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90"
        >
          Join on Telegram
        </a>
      </header>

      {/* 1. Hero — single column, centered, 800px */}
      <section className="mx-auto max-w-[800px] py-12 text-center md:py-16">
        {isTMA ? (
          <motion.div {...anim(0.1)} className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <p className="font-[var(--font-sora)] text-sm font-semibold text-[#0052FF]">
              Opening in Telegram…
            </p>
            <p className="mt-1 text-xs text-[#77736c]">
              Routing to your syndicate dashboard with Telegram theme.
            </p>
            <Link
              href="/syndicate/demo"
              className="mt-4 inline-flex rounded-full bg-[#0052FF] px-6 py-3 text-sm font-bold text-white"
            >
              Go to syndicate
            </Link>
          </motion.div>
        ) : (
          <>
            <motion.div
              {...anim(0.1)}
              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#0052FF]"
            >
              Built on Base • Powered by B20 Stocks
            </motion.div>
            <motion.h1
              {...anim(0.2)}
              className="mt-6 font-[var(--font-newsreader)] text-[56px] font-medium leading-[60px] tracking-tight text-[#101114] max-md:text-[36px] max-md:leading-[40px]"
            >
              Chat-Native Equity Syndicates.
            </motion.h1>
            <motion.p
              {...anim(0.3)}
              className="mx-auto mt-4 max-w-lg font-[var(--font-sora)] text-[18px] leading-7 text-[#77736c]"
            >
              Pool USDC with friends, automate stock investments, and manage fractional portfolios of US
              equities—directly inside Telegram.
            </motion.p>
            <motion.div {...anim(0.4)} className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={TG_APP_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#0052FF] px-7 py-3.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] active:scale-[0.98]"
              >
                Launch in Telegram
              </a>
              <Link
                href="/app"
                className="rounded-full border border-[#e3dfd7] bg-white px-7 py-3.5 text-sm font-semibold text-[#101114] transition hover:bg-[#f5f3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] active:scale-[0.98]"
              >
                Open Web Dashboard
              </Link>
            </motion.div>
            {isLive && (
              <p className="mt-4 text-xs text-[#918d85]">
                Live Sepolia vault{" "}
                <a href={vaultLink} target="_blank" className="font-mono text-[#0052FF] hover:underline">
                  {VAULT.slice(0, 6)}…{VAULT.slice(-4)}
                </a>{" "}
                ·{" "}
                <a href={vaultLink} target="_blank" className="underline">
                  Basescan ↗
                </a>
              </p>
            )}
          </>
        )}
      </section>

      {/* Loom demo — judge portal */}
      <section id="demo" className="mx-auto max-w-[800px] pb-4">
        <div className="overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white">
          <div className="flex items-center justify-between border-b border-[#f0ede8] px-6 py-4">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">DEMO</p>
              <h3 className="mt-1 font-[var(--font-newsreader)] text-[15px] font-medium tracking-tight text-[#101114]">
                Watch the syndicate loop end to end
              </h3>
            </div>
            <span className="hidden rounded-full bg-[#EFF6FF] px-3 py-1.5 text-[11px] font-bold text-[#0052FF] md:inline">
              2 min
            </span>
          </div>
          {LOOM_URL ? (
            <div className="aspect-video w-full bg-[#101114]">
              <iframe src={LOOM_URL} className="h-full w-full" allowFullScreen title="CIRCLA demo" />
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-[#101114] text-white">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0052FF]"
                aria-hidden
              >
                <Play className="h-6 w-6 fill-white text-white" />
              </span>
              <span className="font-[var(--font-sora)] text-sm font-semibold">
                Loom demo drops before Sep 9 — live vault linked below
              </span>
              <span className="font-mono text-[11px] text-white/60">
                {isLive ? "vault live" : "vault pending"} ·{" "}
                <a href={vaultLink} target="_blank" rel="noreferrer" className="underline">
                  Basescan ↗
                </a>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Three-Card Grid */}
      <section id="how" aria-label="How it works" className="grid grid-cols-1 gap-5 pt-6 md:grid-cols-3">
        <motion.article
          {...inView(0)}
          className="rounded-[24px] border border-[#e3dfd7] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0052FF]">
            <Users className="h-[18px] w-[18px]" />
          </div>
          <h3 className="mt-4 font-[var(--font-newsreader)] text-[15px] font-semibold text-[#101114]">
            Group Treasury
          </h3>
          <p className="mt-2 font-[var(--font-sora)] text-[13px] leading-relaxed text-[#77736c]">
            Automate USDC pooling with friends using ChainCircle ROSCA mechanics.
          </p>
        </motion.article>
        <motion.article
          {...inView(0.15)}
          className="rounded-[24px] border border-[#e3dfd7] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0052FF]">
            <LineChart className="h-[18px] w-[18px]" />
          </div>
          <h3 className="mt-4 font-[var(--font-newsreader)] text-[15px] font-semibold text-[#101114]">
            Real US Equities
          </h3>
          <p className="mt-2 font-[var(--font-sora)] text-[13px] leading-relaxed text-[#77736c]">
            Backed 1:1 by real shares via Coinbase Tokenized Stocks on Base.
          </p>
        </motion.article>
        <motion.article
          {...inView(0.3)}
          className="rounded-[24px] border border-[#e3dfd7] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0052FF]">
            <Smartphone className="h-[18px] w-[18px]" />
          </div>
          <h3 className="mt-4 font-[var(--font-newsreader)] text-[15px] font-semibold text-[#101114]">
            Telegram Native
          </h3>
          <p className="mt-2 font-[var(--font-sora)] text-[13px] leading-relaxed text-[#77736c]">
            No seed phrases. Manage everything via chat commands and embedded Mini Apps.
          </p>
        </motion.article>
      </section>

      {/* 3. Product Showcase — Dual-Surface UI */}
      <motion.section
        {...inView(0)}
        aria-label="Product showcase"
        className="mt-6 overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white"
      >
        <div className="flex items-center justify-between border-b border-[#f0ede8] px-6 py-4">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">DUAL-SURFACE UI</p>
            <h3 className="mt-1 font-[var(--font-newsreader)] text-[15px] font-medium tracking-tight text-[#101114]">
              Chat and web, same vault.
            </h3>
            <p className="mt-1 max-w-[560px] font-[var(--font-sora)] text-[11px] leading-relaxed text-[#77736c]">
              One Next.js codebase — Telegram Mini App slide-over + desktop web — viem/wagmi + Coinbase
              Smart Wallet passkeys. Same design system as the syndicate loop.
            </p>
          </div>
          <span className="hidden rounded-full bg-[#f5f3ee] px-3 py-1.5 text-[11px] font-bold text-[#77736c] md:inline">
            Same vault · two surfaces
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 bg-[#fcfaf8] p-4 md:grid-cols-[1.15fr_380px] md:p-6">
          <div className="rounded-2xl border-2 border-dashed border-[#e3dfd7] bg-white p-4 shadow-[0_2px_10px_rgba(16,17,20,0.04)]">
            <p className="text-[10px] font-extrabold tracking-widest text-[#918d85]">
              TELEGRAM · CIRCLA SYNDICATE
            </p>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-2 rounded-full bg-[#0052FF] px-3 py-2 text-[11px] font-bold text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                  ✓
                </span>
                /contribute 50 USDC ✓<span className="ml-auto font-mono text-[10px] opacity-70">you</span>
              </div>
              <div className="rounded-2xl border border-[#e3dfd7] bg-[#f5f3ee] p-3">
                <p className="font-[var(--font-sora)] text-[11px] font-bold leading-relaxed text-[#101114]">
                  Swap executed! 1.14 NVDAc @ $250
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-[#77736c]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF]" /> sepolia proof ·{" "}
                  <a href={vaultLink} target="_blank" className="underline hover:text-[#101114]">
                    Basescan
                  </a>{" "}
                  · scaledBalanceOf
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#e3dfd7] bg-white px-2.5 py-1 text-[10px] font-medium text-[#5e5b57]">
                  B20 Multipliers
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#e3dfd7] bg-white px-2.5 py-1 text-[10px] font-medium text-[#5e5b57]">
                  Aerodrome Swaps
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#e3dfd7] bg-white px-2.5 py-1 text-[10px] font-medium text-[#5e5b57]">
                  Fractional Ledger
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#e3dfd7] bg-white p-5 shadow-[0_2px_10px_rgba(16,17,20,0.04)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold tracking-widest text-[#101114]">PORTFOLIO</p>
              <span className="rounded-full bg-[#EFF6FF] px-2 py-1 text-[10px] font-bold text-[#0052FF]">
                Live
              </span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative h-[88px] w-[88px]">
                <div className="absolute inset-0 rounded-full border-[10px] border-[#e3dfd7]" />
                <div
                  className="absolute inset-0 rounded-full border-[10px] border-[#0052FF] border-b-transparent border-r-transparent"
                  style={{ transform: "rotate(-45deg)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-[#101114]">B20</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-full bg-[#EFF6FF] px-3 py-1.5">
                  <span className="flex items-center gap-1.5 font-bold text-[#101114]">
                    <span className="h-2 w-2 rounded-full bg-[#0052FF]" />
                    62% NVDAc
                  </span>
                  <span className="font-mono text-[11px] text-[#77736c]">800k</span>
                </div>
                <div className="flex items-center justify-between rounded-full bg-[#f5f3ee] px-3 py-1.5">
                  <span className="flex items-center gap-1.5 font-bold text-[#101114]">
                    <span className="h-2 w-2 rounded-full bg-[#d6d3cd]" />
                    38% USDC
                  </span>
                  <span className="font-mono text-[11px] text-[#77736c]">$12.50</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f5f3ee] p-3">
                <p className="text-[10px] font-extrabold tracking-widest text-[#918d85]">POOL VALUE</p>
                <p className="mt-1 font-mono text-sm font-bold text-[#101114]">$20.80</p>
                <p className="text-[11px] text-[#77736c]">scaledBalanceOf · Chainlink</p>
              </div>
              <div className="rounded-xl border border-[#e3dfd7] bg-white p-3">
                <p className="text-[10px] font-extrabold tracking-widest text-[#918d85]">YOUR CLAIM</p>
                <p className="mt-1 font-mono text-sm font-bold text-[#101114]">$10.40</p>
                <p className="text-[11px] text-[#77736c]">pro-rata units</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-[1fr_280px] md:p-6 md:pt-4">
          <div>
            <h3 className="font-[var(--font-newsreader)] text-[18px] font-medium leading-tight tracking-tight text-[#101114]">
              One vault, two surfaces. Full composability.
            </h3>
            <p className="mt-2 max-w-[560px] font-[var(--font-sora)] text-[13px] leading-relaxed text-[#77736c]">
              The same <span className="font-semibold text-[#101114]">CirclaVault</span> powers both. Telegram
              proposes, web dispatches — both read <span className="font-mono text-[11px]">scaledBalanceOf</span>{" "}
              and Chainlink total-return feeds. No duplicated logic.
            </p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#e3dfd7] bg-[#fcfaf8] p-4">
              <p className="text-xs font-bold text-[#101114]">B20-aware portfolio</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#77736c]">
                Donut of NVDAc/AAPLc + idle USDC, multiplier-adjusted. Same component on TMA and desktop —{" "}
                <span className="font-mono text-[11px]">var(--tg-theme-bg-color)</span> aware.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e3dfd7] bg-[#fcfaf8] p-4">
              <p className="text-xs font-bold text-[#101114]">Syndicate feed</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#77736c]">
                Live member deposits and Aerodrome batch swaps — every entry links to Basescan, preserved in the
                same design tokens.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-[#f0ede8] bg-[#fcfaf8] px-4 py-3 md:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3dfd7] bg-white px-3.5 py-2 text-xs font-medium text-[#5e5b57]">
            <span className="h-2 w-2 rounded-full bg-[#0052FF]" />
            B20 Multipliers
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3dfd7] bg-white px-3.5 py-2 text-xs font-medium text-[#5e5b57]">
            <span className="h-2 w-2 rounded-full bg-[#0052FF]" />
            Aerodrome Swaps
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3dfd7] bg-white px-3.5 py-2 text-xs font-medium text-[#5e5b57]">
            <span className="h-2 w-2 rounded-full bg-[#0052FF]" />
            Fractional Ledger
          </span>
        </div>
      </motion.section>

      {/* 4. Workflow Diagram */}
      <section aria-label="Syndicate loop" className="mt-6">
        <WorkflowDiagram />
      </section>

      {/* 5. Security Diagram */}
      <section aria-label="Security and guardrails" className="mt-6">
        <SecurityDiagram />
      </section>

      {/* 6. CTA */}
      <section aria-label="Get started" className="mx-auto max-w-[640px] py-12 text-center">
        <h2 className="font-[var(--font-newsreader)] text-[44px] font-medium leading-[48px] tracking-tight text-[#101114]">
          Start your syndicate today.
        </h2>
        <p className="mx-auto mt-3 max-w-[520px] font-[var(--font-sora)] text-[16px] leading-6 text-[#77736c]">
          Generate a shareable link and fund your club in seconds. Judges can test directly in the browser with
          Coinbase Wallet — no Telegram group required.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={TG_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[#101114] px-7 py-3.5 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] active:scale-[0.98]"
          >
            Launch in Telegram
          </a>
          <Link
            href="/app"
            className="rounded-full border border-[#e3dfd7] bg-white px-7 py-3.5 text-sm font-semibold text-[#101114] transition hover:bg-[#f5f3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] active:scale-[0.98]"
          >
            Open Web Dashboard
          </Link>
        </div>
        <p className="mx-auto mt-6 max-w-[520px] font-[var(--font-sora)] text-[12px] leading-relaxed text-[#918d85]">
          Web app structure: <span className="font-semibold text-[#5e5b57]">Hub (/)</span> →{" "}
          <span className="font-semibold text-[#5e5b57]">Syndicate (/syndicate/[id])</span> →{" "}
          <span className="font-semibold text-[#5e5b57]">Portfolio & Withdraw (/portfolio)</span> — same
          viem/wagmi codebase for desktop and TMA.
        </p>
      </section>

      <footer className="border-t border-[#e3dfd7] py-6 text-center">
        <p className="mx-auto max-w-[720px] font-[var(--font-sora)] text-[11px] leading-relaxed text-[#b8b4ad]">
          Not available for US users. CIRCLA interacts with public smart contracts. Trading involves risk. View
          live contracts on Basescan. Telegram theme adapts via var(--tg-theme-bg-color).
        </p>
        <p className="mt-2 flex flex-wrap justify-center gap-4 text-[11px] text-[#918d85]">
          <a href={vaultLink} target="_blank" className="hover:underline">
            Vault
          </a>
          <a href="https://github.com/Saber1Y/Circla" target="_blank" className="hover:underline">
            GitHub
          </a>
          <a href={TG_URL} target="_blank" className="hover:underline">
            Telegram
          </a>
          <Link href="/app" className="hover:underline">
            Web App
          </Link>
        </p>
      </footer>
    </main>
  );
}
