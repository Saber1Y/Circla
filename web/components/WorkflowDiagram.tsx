"use client";

export default function WorkflowDiagram() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">SYNDICATE LOOP</p>
          <h3 className="mt-1 font-[var(--font-newsreader)] text-xl font-medium tracking-tight text-[#101114]">Chat intent → on-chain B20 trade</h3>
        </div>
        <span className="hidden rounded-full bg-[#f5f3ee] px-3 py-1.5 text-[11px] font-bold text-[#77736c] md:inline">Aerodrome · Base</span>
      </div>

      {/* Mobile: stacked, Desktop: flow */}
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        {/* Step 1 */}
        <div className="animate-slide-in rounded-2xl border border-[#e3dfd7] bg-[#fffaf8] p-4 delay-100">
          <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#101114] text-[11px] font-bold text-white">01</div>
          <p className="text-xs font-bold tracking-wide text-[#101114]">Chat Intent</p>
          <p className="mt-1 font-mono text-[11px] text-[#77736c]">/contribute 50 USDC</p>
          <p className="mt-2 text-[11px] leading-relaxed text-[#77736c]">Member sends command in Telegram</p>
        </div>

        <div className="hidden items-center md:flex">
          <div className="h-[2px] w-8 bg-[#ff4f18] opacity-60" />
          <div className="h-0 w-0 border-y-4 border-l-4 border-y-transparent border-l-[#ff4f18] opacity-60" />
        </div>

        {/* Step 2 */}
        <div className="animate-slide-in rounded-2xl border border-[#e3dfd7] bg-white p-4 delay-200">
          <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#101114] text-[11px] font-bold text-white">02</div>
          <p className="text-xs font-bold tracking-wide text-[#101114]">TMA Wallet Auth</p>
          <p className="mt-1 text-[11px] text-[#77736c]">Passkey / FaceID</p>
          <p className="mt-2 text-[11px] leading-relaxed text-[#77736c]">Coinbase Smart Wallet inside Telegram</p>
        </div>

        <div className="hidden items-center md:flex">
          <div className="h-[2px] w-8 bg-[#101114] opacity-20" />
          <div className="h-0 w-0 border-y-4 border-l-4 border-y-transparent border-l-[#101114] opacity-20" />
        </div>

        {/* Step 3 */}
        <div className="animate-slide-in rounded-2xl border-2 border-[#101114] bg-[#101114] p-4 text-white delay-300">
          <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#ff4f18] text-[11px] font-bold text-white">03</div>
          <p className="text-xs font-bold tracking-wide">CirclaVault</p>
          <p className="mt-1 text-[11px] text-white/70">Threshold check</p>
          <p className="mt-2 text-[11px] leading-relaxed text-white/60">Aggregates pooled USDC, validates quorum</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center justify-center md:justify-end">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#ff4f18]">
            <span className="hidden md:inline">Swap</span>
            <div className="flex items-center">
              <div className="h-[2px] w-6 bg-emerald-500" />
              <div className="h-0 w-0 border-y-4 border-l-4 border-y-transparent border-l-emerald-500" />
            </div>
          </div>
        </div>
        <div className="animate-slide-in rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center delay-400">
          <p className="text-xs font-bold text-emerald-700">Aerodrome DEX</p>
          <p className="mt-1 font-mono text-[11px] text-emerald-600">USDC → NVDAc</p>
          <p className="mt-1 text-[11px] text-emerald-600/70">8 decimals · B20 · Base</p>
        </div>
        <div className="flex items-center justify-center md:justify-start">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#3b82f6]">
            <div className="flex items-center">
              <div className="h-[2px] w-6 bg-[#3b82f6]" />
              <div className="h-0 w-0 border-y-4 border-l-4 border-y-transparent border-l-[#3b82f6]" />
            </div>
            <span className="hidden md:inline">Receipt</span>
          </div>
        </div>
      </div>

      <div className="animate-slide-in mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center delay-500">
        <p className="text-xs font-bold text-blue-700">Social Receipt</p>
        <p className="mt-1 font-mono text-[11px] text-blue-600">Bot posts to group → “Swap executed! 1.14 NVDAc @ $250”</p>
        <p className="mt-1 text-[11px] text-blue-600/60">scaledBalanceOf × Chainlink total-return feed</p>
      </div>

      <p className="mt-4 text-center text-[10px] tracking-wide text-[#918d85]">Edge colors: <span className="text-[#ff4f18]">■ user action</span> · <span className="text-emerald-500">■ DEX execution</span> · <span className="text-[#3b82f6]">■ bot message</span></p>
    </div>
  );
}
