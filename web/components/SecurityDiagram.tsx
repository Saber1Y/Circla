"use client";

export default function SecurityDiagram() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">B20 COMPLIANCE & GUARDRAILS</p>
        <h3 className="mt-1 font-[var(--font-newsreader)] text-xl font-medium tracking-tight text-[#101114]">Strict hooks. No silent failures.</h3>
        <p className="mt-2 max-w-[600px] font-[var(--font-sora)] text-sm leading-relaxed text-[#77736c]">Every withdrawal is policy-checked. Every price is oracle-gated. Forked from Spenda’s allowlist engine.</p>
      </div>

      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1fr]">
        {/* Left Panel */}
        <div className="rounded-2xl border-2 border-dashed border-[#e3dfd7] bg-[#fcfaf8] p-5">
          <p className="text-[10px] font-extrabold tracking-widest text-[#918d85]">CIRCLAVAULT — FRACTIONAL LEDGER</p>
          <div className="mt-4 space-y-3">
            <div className="animate-slide-in rounded-xl border border-[#e3dfd7] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] delay-100">
              <p className="text-xs font-bold text-[#101114]">Withdrawal Request</p>
              <p className="mt-1 text-[11px] text-[#77736c]">Member → withdraw 200k tNVDAc to 0x...</p>
            </div>
            <div className="flex justify-center">
              <div className="h-6 w-[2px] bg-[#ff4f18] opacity-60" />
            </div>
            <div className="animate-slide-in rounded-xl border-2 border-[#101114] bg-[#101114] p-3 text-white delay-200">
              <p className="text-xs font-bold">B20 Policy Registry Hook</p>
              <p className="mt-1 font-mono text-[10px] text-white/60">policyId(TRANSFER_RECEIVER_POLICY) → isAuthorized()</p>
              <p className="mt-1 text-[11px] text-white/70">Crosses to Base Network Enclaves →</p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 p-5">
          <p className="text-[10px] font-extrabold tracking-widest text-emerald-700">BASE NETWORK ENCLAVES</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="animate-slide-in rounded-xl border border-emerald-200 bg-white p-3 delay-300">
              <div className="mb-1.5 h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold text-emerald-800">Authorized</p>
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-700/70">Transfer Stock</p>
              <p className="mt-1 font-mono text-[10px] text-emerald-600">→ B20 transfer succeeds</p>
            </div>
            <div className="animate-slide-in rounded-xl border border-red-200 bg-white p-3 delay-400">
              <div className="mb-1.5 h-2 w-2 rounded-full bg-red-500" />
              <p className="text-xs font-bold text-red-800">Denied</p>
              <p className="mt-1 text-[11px] leading-relaxed text-red-700/70">Liquidate to USDC</p>
              <p className="mt-1 font-mono text-[10px] text-red-600">→ Aerodrome swap → USDC</p>
            </div>
            <div className="col-span-2 animate-slide-in rounded-xl border border-amber-200 bg-amber-50 p-3 delay-500">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <p className="text-xs font-bold text-amber-800">Chainlink Oracle Wrapper</p>
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">72hr Weekend Grace</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-amber-700/70">Isolated node · price staleness quarantined. Harvests scaledBalanceOf separately. Frozen feed ≠ reverted tx.</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] tracking-wide text-[#918d85]">Panels fade in sequentially · boundary line appears · edges trigger with pathLength 0→1</p>
    </div>
  );
}
