"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, LineChart, Smartphone, Play } from "lucide-react";

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

function Avatar({ initial, bot }: { initial: string; bot?: boolean }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
        bot ? "bg-[#0052FF] text-white" : "bg-[#e3dfd7] text-[#5e5b57]"
      }`}
    >
      {initial}
    </span>
  );
}

function YouMsg({ time, children }: { time: string; children: ReactNode }) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-br-md bg-[#0052FF] px-3.5 py-2.5 font-[var(--font-sora)] text-[12px] font-semibold leading-relaxed text-white">
          {children}
        </div>
        <p className="mt-1 text-right font-mono text-[10px] text-[#b8b4ad]">{time} · you ✓✓</p>
      </div>
    </div>
  );
}

function PeerMsg({
  initial,
  name,
  time,
  children,
}: {
  initial: string;
  name: string;
  time: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-end gap-2">
      <Avatar initial={initial} />
      <div className="max-w-[80%]">
        <p className="mb-1 text-[10px] font-bold text-[#0052FF]">{name}</p>
        <div className="rounded-2xl rounded-bl-md border border-[#e3dfd7] bg-white px-3.5 py-2.5 font-[var(--font-sora)] text-[12px] font-semibold leading-relaxed text-[#101114]">
          {children}
        </div>
        <p className="mt-1 font-mono text-[10px] text-[#b8b4ad]">{time}</p>
      </div>
    </div>
  );
}

function BotMsg({
  time,
  children,
  highlight,
}: {
  time: string;
  children: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-end gap-2">
      <Avatar initial="C" bot />
      <div className="max-w-[85%]">
        <p className="mb-1 text-[10px] font-bold text-[#101114]">
          CIRCLA <span className="font-medium text-[#918d85]">bot</span>
        </p>
        <div
          className={`rounded-2xl rounded-bl-md px-3.5 py-2.5 font-[var(--font-sora)] text-[12px] leading-relaxed ${
            highlight
              ? "border-2 border-[#0052FF] bg-[#EFF6FF] text-[#101114]"
              : "border border-[#e3dfd7] bg-white text-[#101114]"
          }`}
        >
          {children}
        </div>
        <p className="mt-1 font-mono text-[10px] text-[#b8b4ad]">{time}</p>
      </div>
    </div>
  );
}

export default function Landing() {
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
        <a href="/" className="flex items-center gap-2">
          <img src="/circla-logo.svg" alt="CIRCLA logo" className="h-7 w-7" />
          <span className="font-[var(--font-newsreader)] text-[17px] font-medium tracking-tight text-[#101114]">
            CIRCLA
            <span className="ml-1 font-[var(--font-sora)] text-[11px] font-bold tracking-widest text-[#0052FF]">
              /BASE
            </span>
          </span>
        </a>
        <nav className="ml-auto hidden items-center gap-5 md:flex">
          <a href="#demo" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            Demo
          </a>
          <a href="#how" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            How it works
          </a>
          <a href="#guardrails" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            Security
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
        <a
          href={vaultLink}
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-full border border-[#e3dfd7] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#101114] hover:bg-[#f5f3ee] md:inline-flex"
        >
          Live vault ↗
        </a>
        <a
          href={TG_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-[#101114] px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90"
        >
          Join on Telegram
        </a>
      </header>

      {/* 1. Hero — split screen: content left, live product visual right */}
      <section className="grid items-center gap-10 py-12 md:grid-cols-[1.02fr_0.98fr] md:py-16">
        <div className="max-md:text-center">
              <motion.div
                {...anim(0.1)}
                className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 py-1.5 pl-2 pr-4 text-xs font-semibold uppercase tracking-wide text-[#0052FF]"
              >
                <img src="/base-logo.svg" alt="Base" className="h-4 w-auto" />
                Built on Base • Powered by B20 Stocks
              </motion.div>
              <motion.h1
                {...anim(0.2)}
                className="mt-6 font-[var(--font-newsreader)] text-[44px] font-medium leading-[46px] tracking-tight text-[#101114] md:text-[60px] md:leading-[62px]"
              >
                Chat-Native <span className="text-[#0052FF]">Equity</span> Syndicates.
              </motion.h1>
              <motion.p
                {...anim(0.3)}
                className="mt-4 max-w-md font-[var(--font-sora)] text-[18px] leading-7 text-[#77736c] max-md:mx-auto"
              >
                Pool USDC with friends, automate stock investments, and manage fractional portfolios—directly
                inside Telegram.
              </motion.p>
              <motion.div {...anim(0.4)} className="mt-8 flex flex-wrap gap-3 max-md:justify-center">
                <a
                  href={TG_APP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#0052FF] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,82,255,0.28)] transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] active:scale-[0.98]"
                >
                  Launch in Telegram
                </a>
                <a
                  href={vaultLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-[#e3dfd7] bg-white px-7 py-3.5 text-sm font-semibold text-[#101114] transition hover:bg-[#f5f3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] active:scale-[0.98]"
                >
                  View live vault
                </a>
              </motion.div>
            </div>
            <motion.div {...anim(0.3)} className="relative max-md:mt-4" aria-label="Live syndicate preview">
              <div className="absolute -inset-8 rounded-full bg-[#0052FF]/10 blur-3xl" aria-hidden />
              <div className="relative rounded-[24px] border border-[#e3dfd7] bg-white p-5 shadow-[0_24px_64px_rgba(16,17,20,0.10)]">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold tracking-widest text-[#101114]">
                    TECH TITANS <span className="font-medium text-[#918d85]">· CIRCLA SYNDICATE</span>
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold text-[#0052FF]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF]" /> Live
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative h-[96px] w-[96px] shrink-0">
                    <div className="absolute inset-0 rounded-full border-[11px] border-[#e3dfd7]" />
                    <div
                      className="absolute inset-0 rounded-full border-[11px] border-[#0052FF] border-b-transparent border-r-transparent"
                      style={{ transform: "rotate(-45deg)" }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-mono text-sm font-bold text-[#101114]">$20.80</span>
                      <span className="text-[9px] font-semibold text-[#918d85]">POOL</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-full bg-[#EFF6FF] px-3 py-1.5">
                      <span className="font-bold text-[#101114]">62% NVDAc</span>
                      <span className="font-mono text-[11px] text-[#77736c]">800k</span>
                    </div>
                    <div className="flex items-center justify-between rounded-full bg-[#f5f3ee] px-3 py-1.5">
                      <span className="font-bold text-[#101114]">38% USDC</span>
                      <span className="font-mono text-[11px] text-[#77736c]">$12.50</span>
                    </div>
                    <p className="font-mono text-[10px] text-[#918d85]">scaledBalanceOf · Chainlink</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-[#77736c]">$200 / $250 threshold</span>
                    <span className="text-[#0052FF]">Quorum 2/2 ✓</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f5f3ee]">
                    <div className="h-2 w-[80%] rounded-full bg-[#0052FF]" />
                  </div>
                </div>
              </div>
              <div className="absolute -right-3 -top-5 max-w-[240px] rounded-2xl border border-[#e3dfd7] bg-white p-3 shadow-[0_16px_40px_rgba(16,17,20,0.12)] max-md:right-0">
                <p className="font-[var(--font-sora)] text-[11px] font-bold leading-relaxed text-[#101114]">
                  Swap executed! 1.14 NVDAc @ $250
                </p>
                <p className="mt-1 font-mono text-[10px] text-[#77736c]">
                  sepolia proof ·{" "}
                  <a href={vaultLink} target="_blank" rel="noreferrer" className="underline">
                    Basescan
                  </a>
                </p>
              </div>
              <div className="absolute -bottom-4 -left-3 flex items-center gap-2 rounded-full border border-[#e3dfd7] bg-white py-2 pl-2 pr-4 shadow-[0_16px_40px_rgba(16,17,20,0.12)] max-md:left-0">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0052FF] text-[11px] font-bold text-white">
                  ✓
                </span>
                <span className="font-mono text-[11px] font-semibold text-[#101114]">/contribute 50 USDC ✓</span>
              </div>
            </motion.div>
          <div className="mt-10 border-t border-[#e3dfd7] pt-6 md:col-span-2">
            <div className="grid grid-cols-3 gap-4 text-left max-md:grid-cols-1 max-md:text-center">
              <div>
                <p className="font-mono text-lg font-bold text-[#101114]">$20.80</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[#918d85]">
                  Pool value · Sepolia proof
                </p>
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-[#101114]">800k tNVDAc</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[#918d85]">
                  Governed buy · Aerodrome
                </p>
              </div>
              <div>
                {isLive ? (
                  <a href={vaultLink} target="_blank" rel="noreferrer" className="font-mono text-lg font-bold text-[#0052FF] hover:underline">
                    {VAULT.slice(0, 6)}…{VAULT.slice(-4)} ↗
                  </a>
                ) : (
                  <p className="font-mono text-lg font-bold text-[#101114]">Vault pending</p>
                )}
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[#918d85]">
                  Live contract · Basescan
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 max-md:justify-center">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#918d85]">
                <img src="/base-logo.svg" alt="Base" className="h-3.5 w-auto" />
                Powered by
              </span>
              {["Coinbase Stocks", "Aerodrome", "Chainlink", "Telegram"].map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e3dfd7] bg-white px-3 py-1.5 text-xs font-semibold text-[#101114]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF]" />
                  {name}
                </span>
              ))}
            </div>
          </div>
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

      {/* 3. Live group chat — the product, as it happens */}
      <motion.section
        {...inView(0)}
        aria-label="Live group chat"
        className="mt-6 overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white"
      >
        <div className="flex items-center justify-between border-b border-[#f0ede8] px-6 py-4">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">LIVE GROUP CHAT</p>
            <h3 className="mt-1 font-[var(--font-newsreader)] text-[15px] font-medium tracking-tight text-[#101114]">
              Watch a syndicate run end to end.
            </h3>
            <p className="mt-1 max-w-[560px] font-[var(--font-sora)] text-[11px] leading-relaxed text-[#77736c]">
              Real commands, real receipts — an illustrated run mirroring the Sepolia proof. On mainnet every
              bot message links Basescan.
            </p>
          </div>
          <span className="hidden items-center gap-2 rounded-full bg-[#f5f3ee] px-3 py-1.5 text-[11px] font-bold text-[#77736c] md:inline-flex">
            <img src="/base-logo.svg" alt="Base" className="h-3.5 w-auto" />
            Tech Titans · 3 members
          </span>
        </div>
        <div className="bg-[#fcfaf8] p-4 md:p-6">
          <div className="mx-auto max-w-[620px] space-y-3">
            <YouMsg time="10:41">/create Tech Titans · quorum 2/3</YouMsg>
            <BotMsg time="10:41">
              Syndicate created ✓<br />
              Pool target $250 · voting: 2 of 3 members.
              <br />
              <span className="text-[#0052FF]">Send /contribute to fund it.</span>
            </BotMsg>
            <YouMsg time="10:42">/contribute 50 USDC ✓</YouMsg>
            <BotMsg time="10:42">
              Contribution received — <span className="font-bold">50.00 tUSDC</span>
              <br />
              Pool $50.00 · your claim 50.00 units.
            </BotMsg>
            <PeerMsg initial="M" name="Marcus" time="10:43">
              /contribute 50 USDC ✓
            </PeerMsg>
            <BotMsg time="10:43">
              2/2 funded — <span className="font-bold">$100 pooled.</span> Propose a stock to buy.
            </BotMsg>
            <YouMsg time="10:44">Buy 80 USDC of NVDAc</YouMsg>
            <BotMsg time="10:44">
              <span className="font-bold">Proposal #1</span> — 80 USDC → ~0.80 tNVDAc via Aerodrome
              <br />
              Min 0.792 · expires 30m · needs 2 approvals
              <br />
              <span className="mt-2 inline-flex gap-2">
                <span className="rounded-full bg-[#0052FF] px-3 py-1 text-[11px] font-bold text-white">
                  Approve 0/2
                </span>
                <span className="rounded-full border border-[#e3dfd7] bg-white px-3 py-1 text-[11px] font-semibold text-[#77736c]">
                  Reject
                </span>
              </span>
            </BotMsg>
            <PeerMsg initial="A" name="Ada" time="10:45">
              ✅ Approve
            </PeerMsg>
            <PeerMsg initial="M" name="Marcus" time="10:45">
              ✅ Approve
            </PeerMsg>
            <BotMsg time="10:45">
              Quorum met 2/2 — executing…
            </BotMsg>
            <BotMsg time="10:46" highlight>
              <span className="font-bold">Swap executed! 0.80 tNVDAc @ $80</span>
              <br />
              <span className="font-mono text-[11px] text-[#77736c]">
                sepolia proof ·{" "}
                <a href={vaultLink} target="_blank" rel="noreferrer" className="underline">
                  Basescan
                </a>{" "}
                · scaledBalanceOf
              </span>
            </BotMsg>
            <BotMsg time="10:46">
              Portfolio — Pool <span className="font-bold">$20.80</span> · 62% NVDAc / 38% USDC
              <br />
              Your claim <span className="font-bold">$10.40</span> · pro-rata units · Chainlink total-return
            </BotMsg>
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-3 md:p-6 md:pt-4">
          <div className="rounded-2xl border border-[#e3dfd7] bg-[#fcfaf8] p-4">
            <p className="text-xs font-bold text-[#101114]">Pool together</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#77736c]">
              USDC contributions mint pro-rata units — your claim, enforced by{" "}
              <span className="font-mono text-[11px]">CirclaVault</span>.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3dfd7] bg-[#fcfaf8] p-4">
            <p className="text-xs font-bold text-[#101114]">Vote in chat</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#77736c]">
              Quorum-gated proposals bind router, amount, and slippage before anyone votes.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3dfd7] bg-[#fcfaf8] p-4">
            <p className="text-xs font-bold text-[#101114]">Own B20 stocks</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#77736c]">
              Aerodrome swaps settle into fractional claims — <span className="font-mono text-[11px]">scaledBalanceOf</span>{" "}
              × Chainlink total-return.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[#f0ede8] bg-[#fcfaf8] px-4 py-3 md:px-6">
          <span className="text-[11px] font-semibold text-[#918d85]">Illustrated run · mirrors the Sepolia proof</span>
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
      <section id="loop" aria-label="Syndicate loop" className="mt-6">
        <WorkflowDiagram />
      </section>

      {/* 5. Security Diagram */}
      <section id="guardrails" aria-label="Security and guardrails" className="mt-6">
        <SecurityDiagram />
      </section>

      {/* 6. CTA */}
      <section aria-label="Get started" className="mx-auto max-w-[640px] py-12 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 py-1.5 pl-2 pr-4">
          <img src="/base-logo.svg" alt="Built on Base" className="h-4 w-auto" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#0052FF]">Built on Base</span>
        </div>
        <h2 className="font-[var(--font-newsreader)] text-[44px] font-medium leading-[48px] tracking-tight text-[#101114]">
          Start your syndicate today.
        </h2>
        <p className="mx-auto mt-3 max-w-[520px] font-[var(--font-sora)] text-[16px] leading-6 text-[#77736c]">
          Generate a shareable link and fund your club in seconds. Everything runs through Telegram — the vault
          enforces every group decision on Base.
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
          <a
            href={vaultLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[#e3dfd7] bg-white px-7 py-3.5 text-sm font-semibold text-[#101114] transition hover:bg-[#f5f3ee] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052FF] active:scale-[0.98]"
          >
            View live vault
          </a>
        </div>
        <p className="mx-auto mt-6 max-w-[520px] font-[var(--font-sora)] text-[12px] leading-relaxed text-[#918d85]">
          How it works: <span className="font-semibold text-[#5e5b57]">Pool USDC</span> →{" "}
          <span className="font-semibold text-[#5e5b57]">Vote in chat</span> →{" "}
          <span className="font-semibold text-[#5e5b57]">Own B20 stocks</span> — quorum-gated, Basescan-verified.
        </p>
      </section>

      <footer className="border-t border-[#e3dfd7] py-6 text-center">
        <p className="mx-auto max-w-[720px] font-[var(--font-sora)] text-[11px] leading-relaxed text-[#b8b4ad]">
          Not available for US users. CIRCLA interacts with public smart contracts. Trading involves risk. View
          live contracts on Basescan.
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
        </p>
      </footer>
    </main>
  );
}
