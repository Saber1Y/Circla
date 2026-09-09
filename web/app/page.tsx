"use client";

import dynamic from "next/dynamic";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Users, LineChart, Smartphone, Play } from "lucide-react";

const WorkflowDiagram = dynamic(() => import("@/components/WorkflowDiagram"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[360px] animate-pulse rounded-[24px] border border-[#e3dfd7] bg-white"
      aria-hidden
    />
  ),
});
const SecurityDiagram = dynamic(() => import("@/components/SecurityDiagram"), {
  ssr: false,
  loading: () => (
    <div
      className="h-[280px] animate-pulse rounded-[24px] border border-[#e3dfd7] bg-white"
      aria-hidden
    />
  ),
});

const VAULT_RE = /^0x[a-fA-F0-9]{40}$/i;
const DEFAULT_VAULT = "0x83f550601Cc9Fc4397216bc8E3422408C285A464";
const TG_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/circlabasebot";
const TG_APP_URL = process.env.NEXT_PUBLIC_TELEGRAM_APP_URL || TG_URL;
const LOOM_URL = process.env.NEXT_PUBLIC_LOOM_URL || "";
const EXPLORER = "https://basescan.org";

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
        <p className="mt-1 text-right font-mono text-[10px] text-[#b8b4ad]">
          {time} · you ✓✓
        </p>
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
  const [vault, setVault] = useState(DEFAULT_VAULT);
  const isLive = Boolean(vault && VAULT_RE.test(vault));
  const vaultLink = isLive ? `${EXPLORER}/address/${vault}` : "#";

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("vault");
    if (raw) setVault(raw.trim());
  }, []);

  const anim = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.6 },
        };
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
          <span className="font-[var(--font-sora)] text-[17px] font-semibold tracking-tight text-[#101114]">
            CIRCLA
            <span className="ml-1 font-[var(--font-sora)] text-[11px] font-bold tracking-widest text-[#0052FF]">
              /BASE
            </span>
          </span>
        </a>
        <nav className="ml-auto hidden items-center gap-5 md:flex">
          <a
            href="#demo"
            className="text-xs font-semibold text-[#77736c] hover:text-[#101114]"
          >
            Demo
          </a>
          <a
            href="#how"
            className="text-xs font-semibold text-[#77736c] hover:text-[#101114]"
          >
            How it works
          </a>
          <a
            href="#proof"
            className="text-xs font-semibold text-[#77736c] hover:text-[#101114]"
          >
            Proof
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
          <motion.h1
            {...anim(0.2)}
            className="mt-6 font-[var(--font-sora)] text-[40px] font-semibold leading-[46px] tracking-[-0.015em] text-[#101114] md:text-[56px] md:leading-[60px]"
          >
            Chat-Native Equity Syndicates.
          </motion.h1>
          <motion.p
            {...anim(0.3)}
            className="mt-4 max-w-md font-[var(--font-sora)] text-[18px] leading-7 text-[#77736c] max-md:mx-auto"
          >
            Pool USDC with friends, automate stock investments, and manage
            fractional portfolios—directly inside Telegram.
          </motion.p>
          <motion.div
            {...anim(0.4)}
            className="mt-8 flex flex-wrap gap-3 max-md:justify-center"
          >
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
        <motion.div
          {...anim(0.3)}
          className="relative max-md:mt-4"
          aria-label="Live syndicate preview"
        >
          <div
            className="absolute -inset-8 rounded-full bg-[#0052FF]/10 blur-3xl"
            aria-hidden
          />
          <div className="relative rounded-[24px] border border-[#e3dfd7] bg-white p-5 shadow-[0_24px_64px_rgba(16,17,20,0.10)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold tracking-widest text-[#101114]">
                TECH TITANS{" "}
                <span className="font-medium text-[#918d85]">
                  · CIRCLA SYNDICATE
                </span>
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
                  <span className="font-mono text-sm font-bold text-[#101114]">
                    $1.00
                  </span>
                  <span className="text-[9px] font-semibold text-[#918d85]">
                    POOL
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-full bg-[#EFF6FF] px-3 py-1.5">
                  <span className="font-bold text-[#101114]">314,425 AAPLc</span>
                  <span className="font-mono text-[11px] text-[#77736c]">
                    $318/sh
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-full bg-[#f5f3ee] px-3 py-1.5">
                  <span className="font-bold text-[#101114]">0 USDC</span>
                  <span className="font-mono text-[11px] text-[#77736c]">
                    $0.00
                  </span>
                </div>
                <p className="font-mono text-[10px] text-[#918d85]">
                  scaledBalanceOf · Chainlink
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-[#77736c]">Quorum 2/2 · met</span>
                <span className="text-[#0052FF]">Proposal #1 ✓</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f5f3ee]">
                <div className="h-2 w-full rounded-full bg-[#0052FF]" />
              </div>
            </div>
            <div className="mt-4 border-t border-[#f0ede8] pt-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#918d85]">
                  Activity
                </p>
                <a
                  href={`${EXPLORER}/tx/0x14b596f6bbe1a399d9d17d4b2c25214feb20923b65a5efb334bfd1f613cf71b3`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-bold text-[#0052FF] hover:underline"
                >
                  Basescan ↗
                </a>
              </div>
              <div className="mt-2 space-y-1.5">
                {[
                  {
                    label: "Vault deployed",
                    value: "0x1885…d9d7",
                    hash: "0x1885a58b90eebc52b40aab3644069f2e0b7c1376cb9916c9bb00cd150d2389d7",
                  },
                  {
                    label: "Deposit",
                    value: "+$1.00",
                    hash: "0x9572e34ada3ee8d2965d729aea16500579cb25ad590b0c38576722bf1eed3f1d",
                  },
                  {
                    label: "Proposal #1",
                    value: "Buy AAPLc",
                    hash: "0x188d9d72126dfa1feea2f1cdc884e6ddd678b7818c63f5023b6af61dd833c200",
                  },
                  {
                    label: "Vote",
                    value: "2/2 ✓",
                    hash: "0xe5a2aa47027737c477bf00261fca3c9a32d5c359c01ce004a6d59b681cf087da",
                  },
                  {
                    label: "Swap",
                    value: "314,425 AAPLc",
                    hash: "0x14b596f6bbe1a399d9d17d4b2c25214feb20923b65a5efb334bfd1f613cf71b3",
                  },
                ].map((tx) => (
                  <div
                    key={tx.label}
                    className="flex items-center justify-between gap-2 rounded-lg bg-[#fcfaf8] px-2.5 py-1.5"
                  >
                    <span className="text-[10px] font-semibold text-[#101114]">
                      {tx.label}
                    </span>
                    <a
                      href={`${EXPLORER}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex items-center gap-1.5 font-mono text-[9px] text-[#0052FF] hover:underline"
                    >
                      <span className="h-1 w-1 rounded-full bg-[#16a34a]" />
                      {tx.value}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -right-3 -top-5 max-w-[240px] rounded-2xl border border-[#e3dfd7] bg-white p-3 shadow-[0_16px_40px_rgba(16,17,20,0.12)] max-md:right-0">
            <p className="font-[var(--font-sora)] text-[11px] font-bold leading-relaxed text-[#101114]">
              Swap executed! 1 USDC → 314,425 AAPLc
            </p>
            <p className="mt-1 font-mono text-[10px] text-[#77736c]">
              mainnet proof ·{" "}
              <a
                href={`${EXPLORER}/tx/0x14b596f6bbe1a399d9d17d4b2c25214feb20923b65a5efb334bfd1f613cf71b3`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Basescan
              </a>
            </p>
          </div>
          <div className="absolute -bottom-4 -left-3 flex items-center gap-2 rounded-full border border-[#e3dfd7] bg-white py-2 pl-2 pr-4 shadow-[0_16px_40px_rgba(16,17,20,0.12)] max-md:left-0">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0052FF] text-[11px] font-bold text-white">
              ✓
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#101114]">
              /contribute 1 USDC ✓
            </span>
          </div>
        </motion.div>
        <div className="mt-10 border-t border-[#e3dfd7] pt-6 md:col-span-2">
          <div className="grid grid-cols-3 gap-4 text-left max-md:grid-cols-1 max-md:text-center">
            <div>
              <p className="font-mono text-lg font-bold text-[#101114]">
                $20.80
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[#918d85]">
                Pool value · Mainnet proof
              </p>
            </div>
            <div>
              <p className="font-mono text-lg font-bold text-[#101114]">
                314.4k AAPLc
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-[#918d85]">
                Governed buy · Aerodrome
              </p>
            </div>
            <div>
              {isLive ? (
                <a
                  href={vaultLink}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-lg font-bold text-[#0052FF] hover:underline"
                >
                  {vault.slice(0, 6)}…{vault.slice(-4)} ↗
                </a>
              ) : (
                <p className="font-mono text-lg font-bold text-[#101114]">
                  Vault pending
                </p>
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
            {["Coinbase Stocks", "Aerodrome", "Chainlink", "Telegram"].map(
              (name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#e3dfd7] bg-white px-3 py-1.5 text-xs font-semibold text-[#101114]"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0052FF]" />
                  {name}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Onchain proof — verified live transactions */}
      <section
        id="proof"
        aria-label="Onchain proof"
        className="mx-auto mb-14 mt-12 max-w-[1000px]"
      >
        <motion.div {...inView(0)}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">
                ONCHAIN PROOF
              </p>
              <h3 className="mt-1 font-[var(--font-sora)] text-[15px] font-semibold tracking-tight text-[#101114]">
                A real governed AAPLc buy on Base Mainnet.
              </h3>
              <p className="mt-1 max-w-[560px] font-[var(--font-sora)] text-[11px] leading-relaxed text-[#77736c]">
                Sep 9, 2026 · Statement of account · 1 USDC in → 314,425 AAPLc
                held by the vault.
              </p>
            </div>
            <a
              href={vaultLink}
              target="_blank"
              rel="noreferrer"
              className="hidden shrink-0 rounded-full bg-[#EFF6FF] px-3.5 py-1.5 text-[11px] font-bold text-[#0052FF] hover:opacity-80 md:inline-block"
            >
              Vault ↗
            </a>
          </div>

          <div className="mt-8 overflow-x-auto pb-2">
            <div className="flex min-w-[680px] items-start md:min-w-0">
              {[
                {
                  step: "Deploy",
                  detail: "Fresh vault · 8 stocks",
                  hash: "0x1885a58b90eebc52b40aab3644069f2e0b7c1376cb9916c9bb00cd150d2389d7",
                  flow: null as string | null,
                },
                {
                  step: "Deposit",
                  detail: "USDC in",
                  hash: "0x9572e34ada3ee8d2965d729aea16500579cb25ad590b0c38576722bf1eed3f1d",
                  flow: "+1 USDC",
                },
                {
                  step: "Proposal #1",
                  detail: "Buy AAPLc · Aerodrome",
                  hash: "0x188d9d72126dfa1feea2f1cdc884e6ddd678b7818c63f5023b6af61dd833c200",
                  flow: "buy intent",
                },
                {
                  step: "Vote",
                  detail: "Quorum met",
                  hash: "0xe5a2aa47027737c477bf00261fca3c9a32d5c359c01ce004a6d59b681cf087da",
                  flow: "approved",
                },
                {
                  step: "Swap executed",
                  detail: "mainnet proof · Basescan",
                  hash: "0x14b596f6bbe1a399d9d17d4b2c25214feb20923b65a5efb334bfd1f613cf71b3",
                  flow: "1 USDC → 314,425 AAPLc",
                  closing: true,
                },
              ].map((row, i) => (
                <Fragment key={row.step}>
                  {i > 0 && (
                    <div className="relative h-10 min-w-[56px] flex-1 md:min-w-[64px]">
                      <span
                        aria-hidden
                        className="absolute left-0 right-0 top-[19px] h-[2px] rounded-full bg-[#d6d3cd]"
                      />
                      <span
                        className={`absolute left-1/2 top-[20px] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#f5f3ee] px-2.5 py-1 ${
                          row.flow!.startsWith("314") || row.flow!.startsWith("+")
                            ? "font-[var(--font-sora)] text-xs font-bold tracking-tight text-[#101114]"
                            : "font-[var(--font-sora)] text-xs font-semibold text-[#0052FF]"
                        }`}
                      >
                        {row.flow}
                      </span>
                    </div>
                  )}
                  <div className="flex w-[116px] shrink-0 flex-col items-center">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        row.closing
                          ? "bg-[#0052FF] ring-4 ring-[#d6e4ff]"
                          : "border-2 border-[#d6e4ff] bg-white"
                      }`}
                    >
                      <Check
                        className={`h-4 w-4 ${
                          row.closing ? "text-white" : "text-[#0052FF]"
                        }`}
                        aria-hidden
                        strokeWidth={3}
                      />
                    </span>
                    <p className="mt-3 text-center font-[var(--font-sora)] text-sm font-semibold tracking-tight text-[#101114]">
                      {row.step}
                    </p>
                    <p className="mt-1 text-center font-[var(--font-sora)] text-[11px] leading-tight text-[#918d85]">
                      {row.detail}
                    </p>
                    <a
                      href={`https://basescan.org/tx/${row.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 font-[var(--font-sora)] text-[10px] font-medium text-[#0052FF] underline-offset-2 hover:underline"
                    >
                      {row.hash.slice(0, 6)}…{row.hash.slice(-4)} ↗
                    </a>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>

          <p className="mt-6 font-[var(--font-sora)] text-[11px] leading-relaxed text-[#918d85]">
            Sep 9, 2026 · CirclaVault{" "}
            <span className="font-semibold text-[#0052FF]">
              {isLive
                ? `${vault.slice(0, 10)}…${vault.slice(-6)}`
                : "0x1f4007…b67c"}
            </span>{" "}
            · AAPLc 0xb200000000000000000000C2e324d24d7eEcd1fb ·
            Basescan-verified
          </p>
        </motion.div>
      </section>

      {/* Loom demo — judge portal */}
      <section id="demo" className="mx-auto max-w-[800px] pb-4">
        <div className="overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white">
          <div className="flex items-center justify-between border-b border-[#f0ede8] px-6 py-4">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">
                DEMO
              </p>
              <h3 className="mt-1 font-[var(--font-sora)] text-[15px] font-semibold tracking-tight text-[#101114]">
                Watch the syndicate loop end to end
              </h3>
            </div>
            <span className="hidden rounded-full bg-[#EFF6FF] px-3 py-1.5 text-[11px] font-bold text-[#0052FF] md:inline">
              2 min
            </span>
          </div>
          {LOOM_URL ? (
            <div className="aspect-video w-full bg-[#101114]">
              <iframe
                src={LOOM_URL}
                className="h-full w-full"
                allowFullScreen
                title="CIRCLA demo"
              />
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
                <a
                  href={vaultLink}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Basescan ↗
                </a>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 2. Three-Card Grid */}
      <section
        id="how"
        aria-label="How it works"
        className="grid grid-cols-1 gap-5 pt-6 md:grid-cols-3"
      >
        <motion.article
          {...inView(0)}
          className="rounded-[24px] border border-[#e3dfd7] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0052FF]">
            <Users className="h-[18px] w-[18px]" />
          </div>
          <h3 className="mt-4 font-[var(--font-sora)] text-[15px] font-semibold text-[#101114]">
            Group Treasury
          </h3>
          <p className="mt-2 font-[var(--font-sora)] text-[13px] leading-relaxed text-[#77736c]">
            Automate USDC pooling with friends using ChainCircle ROSCA
            mechanics.
          </p>
        </motion.article>
        <motion.article
          {...inView(0.15)}
          className="rounded-[24px] border border-[#e3dfd7] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0052FF]">
            <LineChart className="h-[18px] w-[18px]" />
          </div>
          <h3 className="mt-4 font-[var(--font-sora)] text-[15px] font-semibold text-[#101114]">
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
          <h3 className="mt-4 font-[var(--font-sora)] text-[15px] font-semibold text-[#101114]">
            Telegram Native
          </h3>
          <p className="mt-2 font-[var(--font-sora)] text-[13px] leading-relaxed text-[#77736c]">
            No seed phrases. Manage everything via chat commands and embedded
            Mini Apps.
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
            <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">
              LIVE GROUP CHAT
            </p>
            <h3 className="mt-1 font-[var(--font-sora)] text-[15px] font-semibold tracking-tight text-[#101114]">
              Watch a syndicate run end to end.
            </h3>
            <p className="mt-1 max-w-[560px] font-[var(--font-sora)] text-[11px] leading-relaxed text-[#77736c]">
              Real commands, real receipts — an illustrated run on Base
              Mainnet. Every bot message links Basescan.
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
              <span className="text-[#0052FF]">
                Send /contribute to fund it.
              </span>
            </BotMsg>
            <YouMsg time="10:42">/contribute 1 USDC ✓</YouMsg>
            <BotMsg time="10:42">
              Contribution received —{" "}
              <span className="font-bold">1.00 USDC</span>
              <br />
              Pool $1.00 · your claim 1.00 units.
            </BotMsg>
            <PeerMsg initial="M" name="Marcus" time="10:43">
              ├─ funded — 1/1 USDC pooled ✓
            </PeerMsg>
            <BotMsg time="10:43">
              2/2 approve — <span className="font-bold">$1.00 pooled.</span>{" "}
              Propose a stock to buy.
            </BotMsg>
            <YouMsg time="10:44">Buy AAPLc</YouMsg>
            <BotMsg time="10:44">
              <span className="font-bold">Proposal #1</span> — 1 USDC → ~314,425
              AAPLc via Aerodrome
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
            <BotMsg time="10:45">Quorum met 2/2 — executing…</BotMsg>
            <BotMsg time="10:46" highlight>
              <span className="font-bold">
Swap executed! 1 USDC → 314,425 AAPLc
              </span>
              <br />
              <span className="font-mono text-[11px] text-[#77736c]">
                mainnet proof ·{" "}
                <a
                  href={`${EXPLORER}/tx/0x14b596f6bbe1a399d9d17d4b2c25214feb20923b65a5efb334bfd1f613cf71b3`}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Basescan
                </a>{" "}
                · scaledBalanceOf
              </span>
            </BotMsg>
            <BotMsg time="10:46">
              Portfolio — Pool <span className="font-bold">$1.00</span> ·
              314,425 AAPLc / 0 USDC
              <br />
              Your claim <span className="font-bold">$1.00</span> · pro-rata
              units · Chainlink total-return
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
              Quorum-gated proposals bind router, amount, and slippage before
              anyone votes.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3dfd7] bg-[#fcfaf8] p-4">
            <p className="text-xs font-bold text-[#101114]">Own B20 stocks</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#77736c]">
              Aerodrome swaps settle into fractional claims —{" "}
              <span className="font-mono text-[11px]">scaledBalanceOf</span> ×
              Chainlink total-return.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-[#f0ede8] bg-[#fcfaf8] px-4 py-3 md:px-6">
          <span className="text-[11px] font-semibold text-[#918d85]">
            Illustrated run · Mainnet
          </span>
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

      {/* 6. CTA */}
      <section
        aria-label="Get started"
        className="mx-auto max-w-[640px] py-12 text-center"
      >
       <h2 className="font-[var(--font-sora)] text-[40px] font-semibold leading-[48px] tracking-[-0.015em] text-[#101114]">
          Start your syndicate today.
        </h2>
        <p className="mx-auto mt-3 max-w-[520px] font-[var(--font-sora)] text-[16px] leading-6 text-[#77736c]">
          Generate a shareable link and fund your club in seconds. Everything
          runs through Telegram — the vault enforces every group decision on
          Base.
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
          How it works:{" "}
          <span className="font-semibold text-[#5e5b57]">Pool USDC</span> →{" "}
          <span className="font-semibold text-[#5e5b57]">Vote in chat</span> →{" "}
          <span className="font-semibold text-[#5e5b57]">Own B20 stocks</span> —
          quorum-gated, Basescan-verified.
        </p>
      </section>

      <footer className="border-t border-[#e3dfd7] py-6 text-center">
        <p className="mx-auto max-w-[720px] font-[var(--font-sora)] text-[11px] leading-relaxed text-[#b8b4ad]">
          Not available for US users. CIRCLA interacts with public smart
          contracts. Trading involves risk. View live contracts on Basescan.
        </p>
        <p className="mt-2 flex flex-wrap justify-center gap-4 text-[11px] text-[#918d85]">
          <a href={vaultLink} target="_blank" className="hover:underline">
            Vault
          </a>
          <a
            href="https://github.com/Saber1Y/Circla"
            target="_blank"
            className="hover:underline"
          >
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
