"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPublicClient, createWalletClient, custom, formatUnits, http, parseUnits } from "viem";
import { base, baseSepolia } from "viem/chains";
import { useTMA } from "@/hooks/useTMA";

const ZERO = "0x0000000000000000000000000000000000000000";
function env(name: string, fallback = "") {
  return (process.env as any)[`NEXT_PUBLIC_${name}`] ?? fallback;
}
const VAULT = env("CIRCLA_VAULT_ADDRESS");
const USDC = env("CIRCLA_USDC_ADDRESS", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
const RPC_URL = env("BASE_RPC_URL", "https://mainnet.base.org");
const chain = RPC_URL.includes("sepolia") ? baseSepolia : base;
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });

const vaultAbi = [
  { type: "function", name: "circleName", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "poolValue", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "members", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { type: "function", name: "portfolioAsset", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "adjustedAssetBalance", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "totalUnits", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "join", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
] as const;
const erc20Abi = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
] as const;

export default function SyndicatePage({ params }: { params: { id: string } }) {
  const { isTMA } = useTMA();
  const [vaultData, setVaultData] = useState<{
    name: string;
    poolValue: bigint;
    members: string[];
    asset: string;
    adjusted: bigint;
    totalUnits: bigint;
  } | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [amount, setAmount] = useState("50");
  const [activity, setActivity] = useState("No activity yet.");

  useEffect(() => {
    localStorage.setItem("circla:lastSyndicate", params.id);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function refresh() {
    if (!VAULT || VAULT === ZERO) return;
    try {
      const r = await publicClient.multicall({
        contracts: [
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "circleName" },
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "poolValue" },
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "members" },
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "portfolioAsset" },
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "adjustedAssetBalance" },
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "totalUnits" },
        ],
      });
      const v = r.map((x) => (x.status === "success" ? x.result : null));
      if (v.some((x) => x === null)) throw new Error("vault read failed");
      setVaultData({
        name: v[0] as string,
        poolValue: v[1] as bigint,
        members: (v[2] as string[]) ?? [],
        asset: v[3] as string,
        adjusted: v[4] as bigint,
        totalUnits: v[5] as bigint,
      });
    } catch {
      // keep last state; activity surface reports
    }
  }

  function pushActivity(m: string) {
    setActivity(m);
  }

  async function connect() {
    const eth = (window as any).ethereum;
    if (!eth) return pushActivity("Install Coinbase Smart Wallet — passkey supported, works in Telegram WebView and desktop.");
    const wc: any = createWalletClient({ chain, transport: custom(eth) });
    const [addr] = await wc.requestAddresses();
    await wc.switchChain({ id: chain.id });
    setAccount(addr);
    (window as any)._circlaWc = wc;
    pushActivity(`${addr.slice(0, 6)}… connected via Smart Wallet`);
  }

  async function join() {
    const wc = (window as any)._circlaWc;
    if (!wc || !account) return pushActivity("Connect wallet first.");
    const hash = await wc.writeContract({
      address: VAULT as `0x${string}`,
      abi: vaultAbi as any,
      functionName: "join",
      account,
      chain,
    });
    pushActivity(`Join submitted: ${hash.slice(0, 10)}…`);
    await publicClient.waitForTransactionReceipt({ hash });
    pushActivity("Joined syndicate.");
    refresh();
  }

  async function deposit() {
    const wc = (window as any)._circlaWc;
    if (!wc || !account) return pushActivity("Connect wallet first.");
    const amt = parseUnits(amount, 6);
    const h1 = await wc.writeContract({
      address: USDC as `0x${string}`,
      abi: erc20Abi as any,
      functionName: "approve",
      args: [VAULT as `0x${string}`, amt],
      account,
      chain,
    });
    await publicClient.waitForTransactionReceipt({ hash: h1 });
    const h2 = await wc.writeContract({
      address: VAULT as `0x${string}`,
      abi: vaultAbi as any,
      functionName: "deposit",
      args: [amt],
      account,
      chain,
    });
    pushActivity(`Deposit ${amount} USDC: ${h2.slice(0, 10)}…`);
    await publicClient.waitForTransactionReceipt({ hash: h2 });
    refresh();
  }

  const pool = vaultData ? Number(formatUnits(vaultData.poolValue, 6)) : 0;
  const progress = Math.min(100, Math.round((pool / 250) * 100));

  return (
    <main className="mx-auto max-w-[1180px] px-7 py-6 max-md:px-4">
      <header className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-[var(--font-newsreader)] text-[17px] font-medium tracking-tight text-[#101114]"
        >
          CIRCLA
          <span className="ml-1 font-[var(--font-sora)] text-[11px] font-bold tracking-widest text-[#0052FF]">
            /BASE
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/portfolio"
            className="rounded-full border border-[#e3dfd7] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f5f3ee]"
          >
            My Portfolio
          </Link>
          <button onClick={connect} className="rounded-full bg-[#0052FF] px-4 py-2 text-xs font-bold text-white">
            {account ? `${account.slice(0, 6)}…` : "Connect Smart Wallet"}
          </button>
        </div>
      </header>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-[#0052FF]">
        Syndicate: {params.id} {isTMA && "· Telegram Mini App"} · Vault{" "}
        {VAULT ? `${VAULT.slice(0, 6)}…${VAULT.slice(-4)}` : "not configured"}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 max-md:grid-cols-1">
        <section className="rounded-[24px] border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">FUNDING PROGRESS</p>
          <p className="mt-2 font-[var(--font-newsreader)] text-2xl font-medium">${pool.toFixed(2)} / $250</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f5f3ee]">
            <div className="h-2 rounded-full bg-[#0052FF]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#77736c]">
            {vaultData?.members?.length ?? 0} members · {progress}% to threshold
          </p>
          <div className="mt-4 flex gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-24 rounded-lg border border-[#e3dfd7] bg-[#fcfaf8] px-3 py-2 text-sm"
              placeholder="USDC"
            />
            <button onClick={deposit} className="flex-1 rounded-full bg-[#0052FF] py-2 text-xs font-bold text-white">
              Contribute
            </button>
            <button onClick={join} className="rounded-full border border-[#e3dfd7] bg-white px-4 py-2 text-xs font-bold">
              Join
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">SHARED PORTFOLIO</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-[88px] w-[88px]">
              <div className="absolute inset-0 rounded-full border-[10px] border-[#e3dfd7]" />
              <div
                className="absolute inset-0 rounded-full border-[10px] border-[#0052FF] border-b-transparent border-r-transparent"
                style={{ transform: "rotate(-45deg)" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">B20</div>
            </div>
            <div className="text-xs leading-relaxed">
              <p>
                <span className="font-bold">62% NVDAc</span> <span className="text-[#77736c]">800k</span>
              </p>
              <p>
                <span className="font-bold">38% USDC</span> <span className="text-[#77736c]">$12.50</span>
              </p>
              <p className="mt-1 font-mono text-[11px] text-[#77736c]">
                Pool ${vaultData ? formatUnits(vaultData.poolValue, 6) : "--"} · scaledBalanceOf
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-[#f5f3ee] p-3">
            <p className="text-[10px] font-extrabold tracking-widest text-[#77736c]">B20 MULTIPLIER TRACKER</p>
            <p className="mt-1 font-mono text-sm font-bold text-[#101114]">×1.0000</p>
            <p className="text-[11px] text-[#77736c]">
              Corporate actions grow underlying claim without moving your B20 balance.
            </p>
          </div>
        </section>

        <section className="rounded-[24px] border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#0052FF]">MEMBER ACTIVITY FEED</p>
          <div className="mt-3 space-y-2 text-xs">
            <div className="rounded-xl bg-[#fcfaf8] p-3">
              <span className="font-mono text-[10px] text-[#77736c]">0x3f5b… • 50 USDC</span>
              <p className="font-semibold">ContributionReceived</p>
              <a
                href={`https://sepolia.basescan.org/address/${VAULT}`}
                target="_blank"
                className="text-[11px] text-[#0052FF] underline"
              >
                Basescan ↗
              </a>
            </div>
            <div className="rounded-xl bg-[#fcfaf8] p-3">
              <span className="font-mono text-[10px] text-[#77736c]">Proposal #1 • 80 USDC → 800k NVDAc</span>
              <p className="font-semibold">ProposalExecuted via Aerodrome</p>
            </div>
            <div className="rounded-xl bg-[#EFF6FF] p-3">
              <span className="text-[11px] font-bold text-[#0052FF]">Live</span>
              <p className="text-xs">{activity}</p>
            </div>
          </div>
        </section>
      </div>

      <p className="mt-6 text-center text-[11px] text-[#918d85]">
        Same Next.js codebase — desktop web + Telegram Mini App slide-over via viem/wagmi + Coinbase Smart Wallet
        passkeys.
      </p>
    </main>
  );
}
