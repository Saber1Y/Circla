import Link from "next/link";

const VAULT = process.env.NEXT_PUBLIC_CIRCLA_VAULT_ADDRESS || "";
const TG_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/CirclaBot";
const TG_APP_URL = process.env.NEXT_PUBLIC_TELEGRAM_APP_URL || TG_URL;
const EXPLORER = "https://sepolia.basescan.org";
const vaultLink = VAULT ? `${EXPLORER}/address/${VAULT}` : "#";
const isLive = Boolean(VAULT && VAULT.startsWith("0x"));

export default function Landing() {
  return (
    <main className="mx-auto max-w-[1180px] px-7 py-6 max-md:px-4">
      <header className="flex items-center justify-between gap-4">
        <a href="/" className="text-[17px] font-extrabold tracking-tight text-[#101114]">
          CIRCLA<span className="ml-1 text-[11px] font-bold tracking-widest text-[#ff4f18]">/BASE</span>
        </a>
        <nav className="ml-auto hidden items-center gap-5 md:flex">
          <a href="#how" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            How it works
          </a>
          <a href="#proof" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            Live proof
          </a>
          <a href={vaultLink} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            Vault ↗
          </a>
        </nav>
        <Link href="/app" className="rounded-[10px] bg-[#f2f0ec] px-4 py-2.5 text-[13px] font-bold text-[#101114] hover:opacity-80">
          Open app
        </Link>
        <a href={TG_URL} target="_blank" rel="noreferrer" className="rounded-[10px] bg-[#101114] px-4 py-2.5 text-[13px] font-bold text-white hover:opacity-80">
          Join on Telegram
        </a>
      </header>

      <section className="mx-auto max-w-[880px] pb-10 pt-[72px] max-md:pt-8">
        {isLive && (
          <div className="mb-4 inline-flex flex-wrap items-center gap-2 rounded-full bg-[#101114] px-3 py-2 text-[11px] font-bold tracking-wide text-white">
            <span className="h-[7px] w-[7px] rounded-full bg-[#42a85f] shadow-[0_0_0_4px_rgba(66,168,95,0.2)]" />
            LIVE ON BASE SEPOLIA · VAULT {VAULT.slice(0, 6)}…{VAULT.slice(-4)} ·{" "}
            <a href={vaultLink} target="_blank" className="text-[#ff8a6b] hover:underline">
              View on Basescan ↗
            </a>
          </div>
        )}
        <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">PRIVATE INVESTMENT CIRCLES ON BASE</p>
        <h1 className="mt-3 text-[clamp(48px,8vw,96px)] font-extrabold leading-[0.9] tracking-[-0.08em]">
          Your crew.
          <br />
          <em className="not-italic text-[#ff4f18]">One vault.</em>
        </h1>
        <p className="mt-5 max-w-[560px] text-lg leading-relaxed text-[#5e5b57]">
          CIRCLA lets friends pool USDC in Telegram, vote together, and collectively own Coinbase Tokenized Stocks on Base. No brokerage. No custody. Just your circle, your votes, your shares.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href={TG_APP_URL} target="_blank" rel="noreferrer" className="rounded-[10px] bg-[#101114] px-6 py-4 text-sm font-bold text-white hover:opacity-80">
            Join circle on Telegram →
          </a>
          <Link href="/app" className="rounded-[10px] bg-[#f2f0ec] px-6 py-4 text-sm font-bold text-[#101114] hover:opacity-80">
            Open web app
          </Link>
        </div>
        <p className="mt-3 max-w-[520px] text-xs leading-relaxed text-[#918d85]">
          Tokenized stocks are available only to eligible users in permitted non-US jurisdictions. CIRCLA is not a broker or custodian.
        </p>

        <div id="proof" className="mt-8 grid grid-cols-3 gap-3 rounded-2xl border border-[#e3dfd7] bg-white p-4 max-md:grid-cols-1">
          <div className="border-r border-[#ece9e3] pr-4 last:border-0 max-md:border-0">
            <strong className="block text-base tracking-tight">100 tUSDC → 800k tNVDAc</strong>
            <span className="text-[11px] uppercase tracking-widest text-[#918d85]">Governed buy · Sepolia proof · 0x05e56…</span>
          </div>
          <div className="border-r border-[#ece9e3] pr-4 last:border-0 max-md:border-0">
            <strong className="block text-base tracking-tight">Quorum-gated</strong>
            <span className="text-[11px] uppercase tracking-widest text-[#918d85]">2-of-2 votes before any swap</span>
          </div>
          <div>
            <strong className="block text-base tracking-tight">Policy-aware exits</strong>
            <span className="text-[11px] uppercase tracking-widest text-[#918d85]">B20 or auto-USDC liquidation</span>
          </div>
        </div>
      </section>

      <section id="how" className="py-6">
        <div className="mb-4">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">HOW IT WORKS</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">If you can chat, you can invest together.</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
            <span className="text-[11px] font-extrabold tracking-widest text-[#ff4f18]">01 — IN TELEGRAM</span>
            <h3 className="mt-2 text-lg font-bold tracking-tight">Create your circle</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Start CIRCLA in Telegram, name your circle, set quorum. Invite friends with a link — they join with a Base wallet.</p>
            <a href={TG_URL} target="_blank" className="mt-4 inline-block text-xs font-bold text-[#ff4f18] hover:underline">
              Open Telegram →
            </a>
          </article>
          <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
            <span className="text-[11px] font-extrabold tracking-widest text-[#ff4f18]">02 — TOGETHER</span>
            <h3 className="mt-2 text-lg font-bold tracking-tight">Pool & vote</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Deposit USDC, propose a stock (NVDAc, AAPLc), vote in chat. The vault locks the router, amount, and slippage before voting.</p>
          </article>
          <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
            <span className="text-[11px] font-extrabold tracking-widest text-[#ff4f18]">03 — ON-CHAIN</span>
            <h3 className="mt-2 text-lg font-bold tracking-tight">Own it, together</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Execution reads Aerodrome and Chainlink, mints pro-rata units, and tracks scaled B20 balances. Withdraw B20 or USDC anytime.</p>
          </article>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 py-4 max-md:grid-cols-1">
        <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">BUILT FOR CIRCLES</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">Not a trading app</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#77736c]">CIRCLA is for trusted friends saving together — not public pools or anonymous vaults.</p>
        </article>
        <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">VERIFIABLE</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">Every move has a receipt</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Deposits, proposals, votes, swaps — all BaseScan-verified. No mocked balances.</p>
        </article>
        <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">BASE NATIVE</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">B20 done right</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Raw B20 × total-return feed for value, scaledBalanceOf for display, PolicyRegistry for exits.</p>
        </article>
      </section>

      <section className="my-6 rounded-2xl bg-[#101114] p-8 text-white md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff8a6b]">READY TO START?</p>
            <h2 className="mt-2 max-w-[520px] text-3xl font-bold leading-tight tracking-tight">Create your circle in 30 seconds. Inside Telegram.</h2>
            <p className="mt-3 max-w-[520px] text-sm leading-relaxed text-[#b8b4ad]">No forms. No brokerage. Just open Telegram, add CIRCLA, and invite your crew. The vault does the rest.</p>
          </div>
          <div className="flex flex-col gap-3">
            <a href={TG_APP_URL} target="_blank" rel="noreferrer" className="rounded-[10px] bg-white px-6 py-4 text-center text-sm font-bold text-[#101114] hover:opacity-90">
              Join on Telegram →
            </a>
            <Link href="/app" className="rounded-[10px] border border-white/20 px-6 py-4 text-center text-sm font-bold text-white hover:bg-white/10">
              Or open web app
            </Link>
          </div>
        </div>
      </section>

      <footer className="flex justify-between gap-5 px-1 py-6 text-[11px] text-[#918d85] max-md:flex-col">
        <span>Coinbase Tokenized Stocks are available only to eligible non-US users in permitted jurisdictions. CIRCLA is an unaudited prototype.</span>
        <span className="flex gap-3">
          <a href={vaultLink} target="_blank" className="hover:underline">
            Vault
          </a>
          <a href="https://github.com/Saber1Y/Circla" target="_blank" className="hover:underline">
            GitHub
          </a>
          <a href={TG_URL} target="_blank" className="hover:underline">
            Telegram
          </a>
        </span>
      </footer>
    </main>
  );
}
