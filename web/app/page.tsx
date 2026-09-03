import Link from "next/link";
import WorkflowDiagram from "@/components/WorkflowDiagram";
import SecurityDiagram from "@/components/SecurityDiagram";

const VAULT = process.env.NEXT_PUBLIC_CIRCLA_VAULT_ADDRESS || "";
const TG_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/CirclaBot";
const TG_APP_URL = process.env.NEXT_PUBLIC_TELEGRAM_APP_URL || TG_URL;
const EXPLORER = "https://sepolia.basescan.org";
const vaultLink = VAULT ? `${EXPLORER}/address/${VAULT}` : "#";
const isLive = Boolean(VAULT && VAULT.startsWith("0x"));

export default function Landing() {
  return (
    <main className="mx-auto max-w-[1240px] px-7 py-6 max-md:px-4">
      <header className="flex items-center justify-between gap-4">
        <a href="/" className="font-[var(--font-newsreader)] text-[17px] font-medium tracking-tight text-[#101114]">
          CIRCLA<span className="ml-1 font-[var(--font-sora)] text-[11px] font-bold tracking-widest text-[#ff4f18]">/BASE</span>
        </a>
        <nav className="ml-auto hidden items-center gap-5 md:flex">
          <a href="#how" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">How it works</a>
          <a href="#app" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">Web app</a>
          <a href={vaultLink} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">Vault ↗</a>
        </nav>
        <Link href="/app" className="hidden rounded-full border border-[#e3dfd7] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#101114] hover:bg-[#f5f3ee] md:inline-flex">Open Web Dashboard</Link>
        <a href={TG_URL} target="_blank" rel="noreferrer" className="rounded-full bg-[#101114] px-5 py-2.5 text-[13px] font-bold text-white hover:opacity-90">Join on Telegram</a>
      </header>

      {/* 1. Hero */}
      <section className="mx-auto max-w-[800px] py-12 text-center md:py-16">
        <div className="hide-in-tma">
          <div className="animate-slide-in inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#ff4f18] delay-100">Built on Base • Powered by B20 Stocks</div>
          <h1 className="animate-slide-in mt-6 font-[var(--font-newsreader)] text-[56px] font-medium leading-[60px] tracking-tight text-[#101114] delay-200 max-md:text-[36px] max-md:leading-[40px]">Chat-Native Equity Syndicates.</h1>
          <p className="animate-slide-in mx-auto mt-4 max-w-[520px] font-[var(--font-sora)] text-[18px] leading-7 text-[#77736c] delay-300">Pool USDC with friends, automate stock investments, and manage fractional portfolios of US equities—directly inside Telegram.</p>
          <div className="animate-slide-in mt-8 flex flex-wrap justify-center gap-3 delay-400">
            <a href={TG_APP_URL} target="_blank" rel="noreferrer" className="rounded-full bg-[#ff4f18] px-7 py-3.5 text-sm font-bold text-white shadow-sm hover:opacity-90">Launch in Telegram</a>
            <Link href="/app" className="rounded-full border border-[#e3dfd7] bg-white px-7 py-3.5 text-sm font-semibold text-[#101114] hover:bg-[#f5f3ee]">Open Web Dashboard</Link>
          </div>
          {isLive && (
            <p className="mt-4 text-xs text-[#918d85]">Live Sepolia vault <a href={vaultLink} target="_blank" className="font-mono text-[#ff4f18] hover:underline">{VAULT.slice(0, 6)}…{VAULT.slice(-4)}</a> · <a href={vaultLink} target="_blank" className="underline">Basescan ↗</a></p>
          )}
        </div>
        {/* TMA direct route */}
        <div className="hidden data-[tma=true]:block" data-tma>
          <p className="font-[var(--font-sora)] text-sm text-[#77736c]">Opening your syndicate…</p>
          <Link href="/app" className="mt-4 inline-flex rounded-full bg-[#101114] px-6 py-3 text-sm font-bold text-white">Go to dashboard</Link>
        </div>
      </section>

      {/* 2. Three-Card Grid */}
      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <article className="animate-slide-in rounded-[24px] border border-[#e3dfd7] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] delay-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0eb] text-[#ff4f18]">◯</div>
          <h3 className="mt-4 font-[var(--font-newsreader)] text-[15px] font-semibold text-[#101114]">Group Treasury</h3>
          <p className="mt-2 font-[var(--font-sora)] text-[13px] leading-relaxed text-[#77736c]">Automate USDC pooling with friends using ChainCircle ROSCA mechanics.</p>
        </article>
        <article className="animate-slide-in rounded-[24px] border border-[#e3dfd7] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] delay-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">◈</div>
          <h3 className="mt-4 font-[var(--font-newsreader)] text-[15px] font-semibold text-[#101114]">Real US Equities</h3>
          <p className="mt-2 font-[var(--font-sora)] text-[13px] leading-relaxed text-[#77736c]">Backed 1:1 by real shares via Coinbase Tokenized Stocks on Base.</p>
        </article>
        <article className="animate-slide-in rounded-[24px] border border-[#e3dfd7] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] delay-300">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0eb] text-[#ff4f18]">✦</div>
          <h3 className="mt-4 font-[var(--font-newsreader)] text-[15px] font-semibold text-[#101114]">Telegram Native</h3>
          <p className="mt-2 font-[var(--font-sora)] text-[13px] leading-relaxed text-[#77736c]">No seed phrases. Manage everything via chat commands and embedded Mini Apps.</p>
        </article>
      </section>

      {/* 3. Product Showcase */}
      <section className="mt-6 overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white p-3 md:p-4">
        <div className="overflow-hidden rounded-2xl bg-[#f5f3ee] p-2">
          <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br from-[#101114] via-[#1a1d24] to-[#2a2f3a] p-0">
            {/* Placeholder dual-surface mock */}
            <div className="flex h-full w-full">
              <div className="flex flex-1 flex-col gap-2 p-4 md:p-6">
                <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <p className="font-mono text-[10px] text-white/60">Telegram • CIRCLA Syndicate</p>
                  <p className="mt-2 rounded-full bg-[#ff4f18] px-2 py-1 font-mono text-[11px] text-white">/contribute 50 USDC ✓</p>
                  <p className="mt-1.5 rounded-xl bg-white px-3 py-2 text-[11px] leading-relaxed text-[#101114]">Swap executed! 1.14 NVDAc @ $250 — <span className="font-mono text-[10px] text-[#77736c]">sepolia proof</span></p>
                </div>
                <div className="mt-auto flex gap-2">
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/70">B20 Multipliers</span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-white/70">Aerodrome</span>
                </div>
              </div>
              <div className="hidden w-[320px] flex-col gap-3 border-l border-white/10 bg-white p-4 md:flex">
                <p className="text-[11px] font-bold tracking-widest text-[#101114]">PORTFOLIO</p>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-full border-8 border-[#ff4f18] border-r-[#e3dfd7] border-b-[#e3dfd7]" />
                  <div className="text-xs leading-relaxed">
                    <p><span className="font-bold">62% NVDAc</span> <span className="text-[#77736c]">— 800k</span></p>
                    <p><span className="font-bold">38% USDC</span> <span className="text-[#77736c]">— $12.50</span></p>
                  </div>
                </div>
                <div className="rounded-xl bg-[#f5f3ee] p-3">
                  <p className="text-[11px] font-bold text-[#101114]">Pool value</p>
                  <p className="font-mono text-sm font-bold">$20.80</p>
                  <p className="text-[11px] text-[#77736c]">scaledBalanceOf • Chainlink</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_280px]">
          <div>
            <h3 className="font-[var(--font-newsreader)] text-[22px] font-medium leading-tight tracking-tight text-[#101114]">Chat and web, same vault.</h3>
            <p className="mt-2 max-w-[520px] font-[var(--font-sora)] text-[14px] leading-relaxed text-[#77736c]">Start a proposal in Telegram, finish it on the web dashboard — or vice versa. One Next.js codebase powers both the desktop web and the Telegram Mini App slide-over via viem/wagmi and Coinbase Smart Wallet passkeys.</p>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#e3dfd7] bg-white p-4">
              <p className="text-xs font-bold text-[#101114]">B20-aware portfolio</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#77736c]">Donut chart of NVDAc/AAPLc + idle USDC, with multiplier-adjusted claim.</p>
            </div>
            <div className="rounded-2xl border border-[#e3dfd7] bg-white p-4">
              <p className="text-xs font-bold text-[#101114]">Syndicate feed</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#77736c]">Live member deposits and Aerodrome batch swaps, BaseScan-linked.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          <span className="rounded-full border border-[#e3dfd7] bg-[#f5f3ee] px-3.5 py-2 text-xs font-medium text-[#5e5b57]">B20 Multipliers</span>
          <span className="rounded-full border border-[#e3dfd7] bg-[#f5f3ee] px-3.5 py-2 text-xs font-medium text-[#5e5b57]">Aerodrome Swaps</span>
          <span className="rounded-full border border-[#e3dfd7] bg-[#f5f3ee] px-3.5 py-2 text-xs font-medium text-[#5e5b57]">Fractional Ledger</span>
        </div>
      </section>

      {/* 4. Workflow Diagram */}
      <section className="mt-6">
        <WorkflowDiagram />
      </section>

      {/* 5. Security Diagram */}
      <section className="mt-6">
        <SecurityDiagram />
      </section>

      {/* 6. CTA */}
      <section className="mx-auto max-w-[640px] py-12 text-center">
        <h2 className="font-[var(--font-newsreader)] text-[44px] font-medium leading-[48px] tracking-tight text-[#101114]">Start your syndicate today.</h2>
        <p className="mx-auto mt-3 max-w-[520px] font-[var(--font-sora)] text-[16px] leading-6 text-[#77736c]">Generate a shareable link and fund your club in seconds. Judges can test directly in the browser with Coinbase Wallet — no Telegram group required.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={TG_URL} target="_blank" rel="noreferrer" className="rounded-full bg-[#101114] px-7 py-3.5 text-sm font-bold text-white hover:opacity-90">Launch in Telegram</a>
          <Link href="/app" className="rounded-full border border-[#e3dfd7] bg-white px-7 py-3.5 text-sm font-semibold text-[#101114] hover:bg-[#f5f3ee]">Open Web Dashboard</Link>
        </div>
        <p className="mx-auto mt-6 max-w-[520px] font-[var(--font-sora)] text-[12px] leading-relaxed text-[#918d85]">Web app structure: <span className="font-semibold text-[#5e5b57]">Hub (/)</span> → <span className="font-semibold text-[#5e5b57]">Syndicate (/syndicate/[id])</span> → <span className="font-semibold text-[#5e5b57]">Portfolio & Withdraw (/portfolio)</span> — same viem/wagmi codebase for desktop and TMA.</p>
      </section>

      <footer className="border-t border-[#e3dfd7] py-6 text-center">
        <p className="mx-auto max-w-[720px] font-[var(--font-sora)] text-[11px] leading-relaxed text-[#b8b4ad]">Not available for US users. CIRCLA interacts with public smart contracts. Trading involves risk. View live contracts on Basescan. Telegram theme adapts via var(--tg-theme-bg-color).</p>
        <p className="mt-2 flex flex-wrap justify-center gap-4 text-[11px] text-[#918d85]">
          <a href={vaultLink} target="_blank" className="hover:underline">Vault</a>
          <a href="https://github.com/Saber1Y/Circla" target="_blank" className="hover:underline">GitHub</a>
          <a href={TG_URL} target="_blank" className="hover:underline">Telegram</a>
          <Link href="/app" className="hover:underline">Web App</Link>
        </p>
      </footer>
    </main>
  );
}
