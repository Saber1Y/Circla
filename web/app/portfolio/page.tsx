"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPublicClient, http, formatUnits } from "viem";
import { base, baseSepolia } from "viem/chains";
import { useTMA } from "@/hooks/useTMA";

function env(name: string, fallback = "") {
  return (process.env as any)[`NEXT_PUBLIC_${name}`] ?? fallback;
}
const VAULT = env("CIRCLA_VAULT_ADDRESS");
const RPC_URL = env("BASE_RPC_URL", "https://mainnet.base.org");
const chain = RPC_URL.includes("sepolia") ? baseSepolia : base;
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });

const vaultAbi = [
  { type: "function", name: "memberUnits", stateMutability: "view", inputs: [{ name: "who", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "poolValue", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalUnits", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export default function Portfolio() {
  const { isTMA } = useTMA();
  const [account, setAccount] = useState<string | null>(null);
  const [claim, setClaim] = useState<bigint | null>(null);
  const [units, setUnits] = useState<bigint | null>(null);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (eth) {
      eth.request({ method: "eth_accounts" }).then((accs: string[]) => accs[0] && setAccount(accs[0]));
    }
  }, []);

  useEffect(() => {
    if (!account || !VAULT) return;
    (async () => {
      try {
        const [u, p, t] = await publicClient.multicall({
          contracts: [
            { address: VAULT as `0x${string}`, abi: vaultAbi as any, functionName: "memberUnits", args: [account as `0x${string}`] },
            { address: VAULT as `0x${string}`, abi: vaultAbi as any, functionName: "poolValue" },
            { address: VAULT as `0x${string}`, abi: vaultAbi as any, functionName: "totalUnits" },
          ],
        });
        const uVal = u.status === "success" ? (u.result as bigint) : 0n;
        const pVal = p.status === "success" ? (p.result as bigint) : 0n;
        const tVal = t.status === "success" ? (t.result as bigint) : 1n;
        setUnits(uVal);
        setClaim(tVal ? (uVal * pVal) / tVal : 0n);
      } catch {
        // leave null; connect state explains
      }
    })();
  }, [account]);

  return (
    <main className="mx-auto max-w-[880px] px-7 py-6 max-md:px-4">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="font-[var(--font-newsreader)] text-[17px] font-medium text-[#101114]"
        >
          CIRCLA
          <span className="ml-1 font-[var(--font-sora)] text-[11px] font-bold tracking-widest text-[#0052FF]">
            /PORTFOLIO
          </span>
        </Link>
        <Link
          href="/app"
          className="rounded-full border border-[#e3dfd7] bg-white px-4 py-2 text-xs font-semibold"
        >
          Back to app
        </Link>
      </header>

      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-[#0052FF]">
        Individual claim · pro-rata units · {isTMA ? "Telegram Mini App" : "Web"} · {chain.name}
      </div>

      <section className="mt-6 rounded-[24px] border border-[#e3dfd7] bg-white p-6">
        <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">YOUR FRACTIONAL CLAIM</p>
        <p className="mt-2 font-[var(--font-newsreader)] text-[32px] font-medium leading-none tracking-tight text-[#101114]">
          {claim !== null ? `$${formatUnits(claim, 6)}` : "—"}
        </p>
        <p className="mt-1 font-[var(--font-sora)] text-sm text-[#77736c]">
          {units !== null ? `${formatUnits(units, 18)} units` : "Connect wallet to see claim"} · Pool{" "}
          {VAULT ? `${VAULT.slice(0, 6)}…` : ""}
        </p>
        <div className="mt-4 rounded-xl bg-[#f5f3ee] p-3">
          <p className="text-[11px] font-bold text-[#101114]">How it works</p>
          <p className="mt-1 text-xs leading-relaxed text-[#77736c]">
            Your units = your share of (raw B20 × Chainlink total-return price + USDC). B20 multipliers only
            affect the displayed share count via <span className="font-mono">scaledBalanceOf</span>.
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-[24px] border border-[#e3dfd7] bg-white p-6">
        <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">WITHDRAWAL GATEWAY</p>
        <h3 className="mt-2 font-[var(--font-newsreader)] text-xl font-medium text-[#101114]">
          Exit in one tap
        </h3>
        <p className="mt-2 max-w-[560px] font-[var(--font-sora)] text-sm leading-relaxed text-[#77736c]">
          The vault checks <span className="font-mono text-xs">policyId(TRANSFER_RECEIVER_POLICY) → isAuthorized()</span>{" "}
          on Base. Authorized → B20 transfer. Denied → auto-liquidate to USDC via Aerodrome. No silent failures.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/app" className="rounded-full bg-[#0052FF] px-6 py-3 text-sm font-bold text-white">
            Go to withdraw
          </Link>
          <a
            href={VAULT ? `https://sepolia.basescan.org/address/${VAULT}` : "#"}
            target="_blank"
            className="rounded-full border border-[#e3dfd7] bg-white px-6 py-3 text-sm font-semibold"
          >
            View vault on Basescan
          </a>
        </div>
        <p className="mt-3 text-[11px] text-[#918d85]">
          Chainlink 72hr weekend grace · 30m batch window · $250 threshold · Base blue + white only
        </p>
      </section>

      <p className="mt-6 text-center text-[11px] text-[#918d85]">
        Connect with Coinbase Smart Wallet (passkey) — works in Telegram WebView and desktop Chrome.
      </p>
    </main>
  );
}
