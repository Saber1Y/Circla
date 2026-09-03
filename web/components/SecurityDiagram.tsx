"use client";

import { ShieldCheck, ShieldX, Timer, Shield } from "lucide-react";

export default function SecurityDiagram() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e3dfd7] bg-white p-6 md:p-8">
      <div className="mb-6">
        <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">B20 COMPLIANCE & GUARDRAILS</p>
        <h3 className="mt-1 font-[var(--font-newsreader)] text-xl font-medium tracking-tight text-[#101114]">Strict hooks. No silent failures.</h3>
        <p className="mt-2 max-w-[600px] font-[var(--font-sora)] text-sm leading-relaxed text-[#77736c]">Every withdrawal is policy-checked. Every price is oracle-gated. Forked from Spenda’s allowlist engine — now in Base blue + white.</p>
      </div>

      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border-2 border-dashed border-[#e3dfd7] bg-[#fcfaf8] p-5">
          <p className="text-[10px] font-extrabold tracking-widest text-[#77736c]">CIRCLAVAULT — FRACTIONAL LEDGER</p>
          <div className="mt-4 space-y-3">
            <div className="animate-slide-in rounded-xl border border-[#e3dfd7] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)] delay-100">
              <p className="text-xs font-bold text-[#101114]">Withdrawal Request</p>
              <p className="mt-1 text-[11px] text-[#77736c]">Member → withdraw 200k tNVDAc to 0x...</p>
            </div>
            <div className="flex justify-center">
              <div className="h-6 w-[2px] bg-[#0052FF] opacity-60" />
            </div>
            <div className="animate-slide-in rounded-xl border-2 border-[#0052FF] bg-[#0052FF] p-3 text-white delay-200">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white">
                  <Shield className="h-3.5 w-3.5" />
                </span>
                <p className="text-xs font-bold">B20 Policy Registry Hook</p>
              </div>
              <p className="mt-2 font-mono text-[10px] text-white/70">policyId(TRANSFER_RECEIVER_POLICY) → isAuthorized()</p>
              <p className="mt-1 text-[11px] text-white/80">Crosses to Base Network Enclaves →</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-[#0052FF]/20 bg-[#EFF6FF]/60 p-5">
          <p className="text-[10px] font-extrabold tracking-widest text-[#0052FF]">BASE NETWORK ENCLAVES</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="animate-slide-in rounded-xl border border-[#0052FF]/20 bg-white p-3 delay-300">
              <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#EFF6FF] text-[#0052FF]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-[#0052FF]">Authorized</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#0052FF]/70">Transfer Stock</p>
              <p className="mt-1 font-mono text-[10px] text-[#0052FF]">→ B20 transfer succeeds</p>
            </div>
            <div className="animate-slide-in rounded-xl border border-[#e3dfd7] bg-white p-3 delay-400">
              <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#f5f3ee] text-[#0052FF]">
                <ShieldX className="h-4 w-4" />
              </div>
              <p className="text-xs font-bold text-[#101114]">Denied</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#77736c]">Liquidate to USDC</p>
              <p className="mt-1 font-mono text-[10px] text-[#0052FF]">→ Aerodrome swap → USDC</p>
            </div>
            <div className="col-span-2 animate-slide-in rounded-xl border border-[#0052FF]/20 bg-white p-3 delay-500">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EFF6FF] text-[#0052FF]">
                  <Timer className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-[#0052FF]">Chainlink Oracle Wrapper</p>
                <span className="ml-auto rounded-full bg-[#0052FF] px-2 py-0.5 text-[10px] font-bold text-white">72hr Weekend Grace</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-[#77736c]">Isolated node · price staleness quarantined. Harvests scaledBalanceOf separately. Frozen feed ≠ reverted tx.</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[10px] tracking-wide text-[#77736c]">Panels fade in sequentially · boundary line appears · edges trigger with pathLength 0→1 · Base blue + white only</p>
    </div>
  );
}
