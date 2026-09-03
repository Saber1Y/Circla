"use client";

import { useEffect, useState } from "react";
import { createPublicClient, createWalletClient, custom, formatUnits, http, parseUnits } from "viem";
import { base, baseSepolia } from "viem/chains";

const ZERO = "0x0000000000000000000000000000000000000000";

function env(name: string, fallback = "") {
  // Next.js uses NEXT_PUBLIC_, Vite used VITE_ — support both
  return (process.env as any)[`NEXT_PUBLIC_${name}`] ?? (process.env as any)[`VITE_${name}`] ?? fallback;
}

const VAULT = env("CIRCLA_VAULT_ADDRESS");
const USDC = env("CIRCLA_USDC_ADDRESS", "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913");
const STOCK = env("CIRCLA_STOCK_ADDRESS", "0xb20000000000000000000078ee7ce2fE4908108C");
const ROUTER = env("CIRCLA_ROUTER_ADDRESS");
const FACTORY = env("CIRCLA_AERODROME_FACTORY_ADDRESS");
const RPC_URL = env("BASE_RPC_URL", "https://mainnet.base.org");

const chain = RPC_URL.includes("sepolia") ? baseSepolia : base;
const explorerBase = chain.id === baseSepolia.id ? "https://sepolia.basescan.org" : "https://basescan.org";
const vaultLink = VAULT && VAULT !== ZERO ? `${explorerBase}/address/${VAULT}` : "#";
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });

const vaultAbi = [
  { type: "function", name: "join", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "deposit", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }], outputs: [] },
  { type: "function", name: "circleName", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "poolValue", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "members", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { type: "function", name: "portfolioAsset", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "adjustedAssetBalance", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "createProposal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "asset", type: "address" },
      { name: "router", type: "address" },
      { name: "amountIn", type: "uint256" },
      { name: "minAmountOut", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  { type: "function", name: "vote", stateMutability: "nonpayable", inputs: [{ name: "proposalId", type: "uint256" }, { name: "support", type: "bool" }], outputs: [] },
  {
    type: "function",
    name: "executeProposal",
    stateMutability: "nonpayable",
    inputs: [
      { name: "router", type: "address" },
      { name: "proposalId", type: "uint256" },
      { name: "routes", type: "tuple[]", components: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "stable", type: "bool" }, { name: "factory", type: "address" }] },
    ],
    outputs: [{ type: "uint256" }],
  },
  { type: "function", name: "withdraw", stateMutability: "nonpayable", inputs: [{ name: "units", type: "uint256" }, { name: "recipient", type: "address" }], outputs: [{ type: "uint256" }, { type: "uint256" }] },
] as const;

const erc20Abi = [{ type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }] as const;
const routerAbi = [
  {
    type: "function",
    name: "getAmountsOut",
    stateMutability: "view",
    inputs: [{ name: "amountIn", type: "uint256" }, { name: "routes", type: "tuple[]", components: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "stable", type: "bool" }, { name: "factory", type: "address" }] }],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
] as const;

export default function Page() {
  const [account, setAccount] = useState<string | null>(null);
  const [walletClient, setWalletClient] = useState<any>(null);
  const [activity, setActivity] = useState("No wallet activity yet.");
  const [isError, setIsError] = useState(false);
  const [vaultData, setVaultData] = useState<{ name: string; poolValue: bigint; members: string[]; asset: string; adjusted: bigint } | null>(null);
  const [depositAmount, setDepositAmount] = useState("50");
  const [orderAmount, setOrderAmount] = useState("100");
  const [slippage, setSlippage] = useState("100");
  const [proposalId, setProposalId] = useState("1");
  const [orderId, setOrderId] = useState("");
  const [units, setUnits] = useState("0");
  const [recipient, setRecipient] = useState("");
  const [quoteResult, setQuoteResult] = useState("");

  const isSepolia = chain.id === baseSepolia.id;

  useEffect(() => {
    if (VAULT && VAULT !== ZERO) refresh();
  }, []);

  async function connect() {
    const eth = (window as any).ethereum;
    if (!eth) return pushActivity("Install a Base-compatible wallet to continue.", true);
    const client = createWalletClient({ chain, transport: custom(eth) });
    const [addr] = await client.requestAddresses();
    await client.switchChain({ id: chain.id });
    setWalletClient(client);
    setAccount(addr);
    pushActivity(`${addr.slice(0, 6)}…${addr.slice(-4)} connected on ${chain.name}.`);
    await refresh();
  }

  async function refresh() {
    if (!VAULT || VAULT === ZERO || !VAULT.startsWith("0x")) return pushActivity("Set NEXT_PUBLIC_CIRCLA_VAULT_ADDRESS to read the deployed vault.", true);
    try {
      const results = await publicClient.multicall({
        contracts: [
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "circleName" },
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "poolValue" },
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "members" },
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "portfolioAsset" },
          { address: VAULT as `0x${string}`, abi: vaultAbi, functionName: "adjustedAssetBalance" },
        ],
      });
      const vals = results.map((r) => (r.status === "success" ? r.result : null));
      if (vals.some((v) => v === null)) throw new Error("one or more vault reads failed");
      setVaultData({ name: vals[0] as string, poolValue: vals[1] as bigint, members: vals[2] as string[], asset: vals[3] as string, adjusted: vals[4] as bigint });
      pushActivity(`Vault refreshed from ${chain.name} at ${new Date().toLocaleTimeString()}.`);
    } catch (e: any) {
      pushActivity(`Vault read failed: ${e.shortMessage ?? e.message}`, true);
    }
  }

  function pushActivity(text: string, error = false) {
    setActivity(text);
    setIsError(error);
  }

  function requireWallet() {
    if (!walletClient || !account) throw new Error("Connect a wallet first.");
    if (!VAULT || VAULT === ZERO) throw new Error("Configure the deployed CIRCLA vault first.");
  }

  function requireTradingConfig() {
    if (!ROUTER || ROUTER === ZERO || !FACTORY || FACTORY === ZERO) throw new Error("Configure the Aerodrome router and factory first.");
  }

  function route(from: string, to: string) {
    return { from: from as `0x${string}`, to: to as `0x${string}`, stable: false, factory: FACTORY as `0x${string}` };
  }

  async function send(functionName: string, args: any[], address = VAULT as `0x${string}`) {
    requireWallet();
    const abi = address.toLowerCase() === USDC.toLowerCase() ? erc20Abi : vaultAbi;
    const hash = await walletClient.writeContract({ address, abi: abi as any, functionName, args, account, chain });
    pushActivity(`Submitted ${functionName}. Waiting for confirmation...`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    pushActivity(`${functionName} confirmed: ${hash}`);
    await refresh();
    return receipt;
  }

  async function deposit() {
    try {
      requireWallet();
      const amount = parseUnits(depositAmount, 6);
      await send("approve", [VAULT, amount], USDC as `0x${string}`);
      await send("deposit", [amount]);
    } catch (e: any) {
      pushActivity(`Deposit failed: ${e.shortMessage ?? e.message}`, true);
    }
  }

  async function vote(support: boolean) {
    try {
      requireWallet();
      await send("vote", [BigInt(proposalId), support]);
    } catch (e: any) {
      pushActivity(`Vote failed: ${e.shortMessage ?? e.message}`, true);
    }
  }

  async function withdraw() {
    try {
      requireWallet();
      const rec = (recipient || account) as `0x${string}`;
      await send("withdraw", [BigInt(units), rec]);
    } catch (e: any) {
      pushActivity(`Withdraw failed: ${e.shortMessage ?? e.message}`, true);
    }
  }

  async function createProposal() {
    try {
      requireWallet();
      requireTradingConfig();
      const amountIn = parseUnits(orderAmount, 6);
      const routes = [route(USDC, STOCK)];
      const amounts = await publicClient.readContract({ address: ROUTER as `0x${string}`, abi: routerAbi, functionName: "getAmountsOut", args: [amountIn, routes as any] });
      const quotedOut = amounts[amounts.length - 1] as bigint;
      const bps = BigInt(slippage);
      if (bps < 0n || bps >= 10000n) throw new Error("slippage must be less than 10000 bps");
      const minAmountOut = (quotedOut * (10000n - bps)) / 10000n;
      setQuoteResult(`Quote: ${formatUnits(quotedOut, 8)} tNVDAc. Minimum: ${formatUnits(minAmountOut, 8)} — creating proposal...`);
      const receipt: any = await send("createProposal", [STOCK, ROUTER, amountIn, minAmountOut]);
      const log = receipt.logs?.find((l: any) => l.address?.toLowerCase() === VAULT.toLowerCase() && l.topics?.length > 1);
      if (log) {
        const id = BigInt(log.topics[1]).toString();
        setProposalId(id);
        setOrderId(id);
        setQuoteResult(`Proposal #${id} created. Share it in Telegram for votes.`);
      }
    } catch (e: any) {
      pushActivity(`Proposal creation failed: ${e.shortMessage ?? e.message}`, true);
    }
  }

  async function executeProposal() {
    try {
      requireWallet();
      requireTradingConfig();
      const id = orderId || proposalId;
      if (!id) throw new Error("Enter a proposal ID first.");
      await send("executeProposal", [ROUTER, BigInt(id), [route(USDC, STOCK)]]);
    } catch (e: any) {
      pushActivity(`Execute failed: ${e.shortMessage ?? e.message}`, true);
    }
  }

  return (
    <main className="mx-auto max-w-[1180px] px-7 py-6 max-md:px-4">
      <header className="flex items-center justify-between gap-4">
        <a href="/" className="text-[17px] font-extrabold tracking-tight text-[#101114]">
          CIRCLA<span className="ml-1 text-[11px] font-bold tracking-widest text-[#ff4f18]">/BASE</span>
        </a>
        <nav className="ml-auto hidden gap-4 md:flex">
          <a href="#how" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            How it works
          </a>
          <a href="#app" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            App
          </a>
          <a href={vaultLink} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#77736c] hover:text-[#101114]">
            Vault ↗
          </a>
        </nav>
        <button onClick={connect} className="rounded-[10px] bg-[#101114] px-4 py-3 text-[13px] font-bold text-white hover:opacity-80">
          {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Connect wallet"}
        </button>
      </header>

      <section className="max-w-[880px] pb-14 pt-[72px] max-md:pt-12">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#101114] px-3 py-2 text-[11px] font-bold tracking-wide text-white">
          <span className="h-[7px] w-[7px] rounded-full bg-[#42a85f] shadow-[0_0_0_4px_rgba(66,168,95,0.2)]" /> LIVE ON {isSepolia ? "BASE SEPOLIA" : "BASE"} · VAULT {VAULT ? `${VAULT.slice(0, 6)}…${VAULT.slice(-4)}` : "NOT CONFIGURED"} ·{" "}
          <a href={vaultLink} target="_blank" className="text-[#ff8a6b] hover:underline">
            View on Basescan ↗
          </a>
        </div>
        <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">PRIVATE INVESTMENT CIRCLES ON BASE</p>
        <h1 className="mt-3 text-[clamp(52px,8vw,102px)] font-extrabold leading-[0.9] tracking-[-0.085em]">
          Make the group decision.
          <br />
          <em className="not-italic text-[#ff4f18]">Own the outcome.</em>
        </h1>
        <p className="mt-6 max-w-[560px] text-lg leading-relaxed text-[#5e5b57]">
          CIRCLA turns Telegram votes into transparent, policy-bound ownership of Coinbase Tokenized Stocks. No brokerage. No custody. Just your circle, your vault, your votes.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <a href="#app" className="rounded-[10px] bg-[#101114] px-[18px] py-[14px] text-sm font-bold text-white hover:opacity-80">
            Launch app
          </a>
          <a href={vaultLink} target="_blank" className="rounded-[10px] bg-[#f2f0ec] px-[18px] py-[14px] text-sm font-bold text-[#101114] hover:opacity-80">
            View live vault
          </a>
        </div>
        <div className="mt-7 flex items-center gap-2 text-xs text-[#77736c]">
          <span className={`h-[7px] w-[7px] rounded-full ${account ? "bg-[#42a85f] shadow-[0_0_0_4px_rgba(66,168,95,0.15)]" : "bg-[#bcb8b0]"}`} /> {account ? `${account.slice(0, 6)}…${account.slice(-4)} connected` : "Wallet not connected"} <span className="text-[#c4c0b8]">/</span> {chain.name} <span className="text-[#c4c0b8]">/</span> Eligible non-US only
        </div>
        <div className="mt-7 grid grid-cols-3 gap-4 rounded-2xl border border-[#e3dfd7] bg-white p-4 max-md:grid-cols-1">
          <div className="border-r border-[#ece9e3] pr-4 last:border-0 max-md:border-0">
            <strong className="block text-base tracking-tight">100 tUSDC</strong>
            <span className="text-[11px] uppercase tracking-widest text-[#918d85]">pooled · Sepolia proof</span>
          </div>
          <div className="border-r border-[#ece9e3] pr-4 last:border-0 max-md:border-0">
            <strong className="block text-base tracking-tight">800k tNVDAc</strong>
            <span className="text-[11px] uppercase tracking-widest text-[#918d85]">bought via governed proposal</span>
          </div>
          <div>
            <strong className="block text-base tracking-tight">2 members</strong>
            <span className="text-[11px] uppercase tracking-widest text-[#918d85]">quorum-gated execution</span>
          </div>
        </div>
      </section>

      <section id="how" className="py-4">
        <div className="mb-4">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">HOW IT WORKS</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">Three steps. One vault. No middleman.</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
            <span className="text-[11px] font-extrabold tracking-widest text-[#ff4f18]">01</span>
            <h3 className="mt-2 text-lg font-bold tracking-tight">Pool</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Friends join a private circle and deposit USDC. Every deposit mints pro-rata units — your claim, on-chain.</p>
          </article>
          <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
            <span className="text-[11px] font-extrabold tracking-widest text-[#ff4f18]">02</span>
            <h3 className="mt-2 text-lg font-bold tracking-tight">Vote</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Anyone proposes a Coinbase stock buy. The vault binds the router, amount, and slippage before votes start.</p>
          </article>
          <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
            <span className="text-[11px] font-extrabold tracking-widest text-[#ff4f18]">03</span>
            <h3 className="mt-2 text-lg font-bold tracking-tight">Own</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Quorum-gated execution swaps via Aerodrome, reads the Chainlink feed, and tracks scaled B20 balances.</p>
          </article>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 py-4 max-md:grid-cols-1">
        <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">B20 POLICY</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">Eligibility-aware withdrawals</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Direct B20 to authorized wallets, or guarded USDC liquidation when the recipient is blocked.</p>
        </article>
        <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">PRO-RATA TRUTH</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">Your units, your share</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Pool value = raw B20 × Chainlink total-return price + USDC. Multipliers only affect display.</p>
        </article>
        <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">TELEGRAM NATIVE</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">Votes where you chat</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Typed intents, proposal previews, and BaseScan receipts — the bot proposes, the vault enforces.</p>
        </article>
      </section>

      <section id="app" className="grid grid-cols-2 gap-3 py-4 max-md:grid-cols-1">
        <article className="col-span-2 rounded-2xl border border-[#e3dfd7] bg-white p-6 max-md:col-span-1">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">LIVE CIRCLE</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{vaultData?.name ?? "Connect to load vault"}</h2>
            </div>
            <span className="rounded-full bg-[#fff0eb] px-3 py-2 text-[10px] font-extrabold tracking-widest text-[#ef4b19]">B20 EQUITY</span>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-6 border-t border-[#ece9e3] pt-5 max-md:gap-3">
            <div>
              <span className="block text-[10px] font-extrabold tracking-widest text-[#918d85]">POOL VALUE</span>
              <strong className="text-xl tracking-tight max-md:text-base">{vaultData ? `${formatUnits(vaultData.poolValue, 6)} USDC` : "--"}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-extrabold tracking-widest text-[#918d85]">MEMBERS</span>
              <strong className="text-xl tracking-tight max-md:text-base">{vaultData ? vaultData.members.length : "--"}</strong>
            </div>
            <div>
              <span className="block text-[10px] font-extrabold tracking-widest text-[#918d85]">ASSET BALANCE</span>
              <strong className="text-xl tracking-tight max-md:text-base">{vaultData ? (vaultData.asset === ZERO ? "No stock yet" : `${formatUnits(vaultData.adjusted, 8)} adjusted`) : "--"}</strong>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <button onClick={async () => {
              try {
                if (!account) throw new Error("Connect wallet first");
                const c = createWalletClient({ chain, transport: custom((window as any).ethereum) });
                const [a] = await c.requestAddresses();
                const hash = await c.writeContract({ address: VAULT as `0x${string}`, abi: vaultAbi as any, functionName: "join", account: a, chain });
                pushActivity(`Submitted join. Waiting...`);
                await publicClient.waitForTransactionReceipt({ hash });
                pushActivity(`join confirmed: ${hash}`);
                await refresh();
              } catch (e: any) { pushActivity(`join failed: ${e.shortMessage ?? e.message}`, true); }
            }} className="rounded-[10px] bg-[#f2f0ec] px-4 py-3 text-[13px] font-bold">
              Join circle
            </button>
            <button onClick={refresh} className="rounded-[10px] bg-[#f2f0ec] px-4 py-3 text-[13px] font-bold">
              Refresh vault
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">CONTRIBUTE</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Add to the pool</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Approve Base USDC, then deposit it into the circle vault.</p>
          <label className="mt-5 block text-[11px] font-bold text-[#77736c]">USDC amount</label>
          <input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="mt-2 w-full rounded-[9px] border border-[#e1ded7] bg-[#f7f6f3] p-3 outline-none focus:border-[#ff4f18] focus:ring-2 focus:ring-[#ff4f1820]" />
          <button onClick={deposit} className="mt-5 w-full rounded-[10px] bg-[#101114] py-3 text-[13px] font-bold text-white hover:opacity-80">
            Approve and deposit
          </button>
        </article>

        <article className="col-span-2 rounded-2xl border border-[#e3dfd7] bg-white p-6 max-md:col-span-1">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">TOKENIZED STOCK ORDER</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Propose and execute a buy</h2>
            </div>
            <span className="rounded-full bg-[#fff0eb] px-3 py-2 text-[10px] font-extrabold tracking-widest text-[#ef4b19]">AERODROME ROUTE</span>
          </div>
          <p className="mt-2 max-w-[520px] text-sm leading-relaxed text-[#77736c]">The quote is read from the configured Aerodrome router. The proposal stores the router, asset, amount, and minimum output before anyone votes.</p>
          <div className="mt-4 grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <div>
              <label className="block text-[11px] font-bold text-[#77736c]">USDC amount</label>
              <input value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} className="mt-2 w-full rounded-[9px] border border-[#e1ded7] bg-[#f7f6f3] p-3 outline-none focus:border-[#ff4f18] focus:ring-2 focus:ring-[#ff4f1820]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#77736c]">Slippage (bps)</label>
              <input value={slippage} onChange={(e) => setSlippage(e.target.value)} className="mt-2 w-full rounded-[9px] border border-[#e1ded7] bg-[#f7f6f3] p-3 outline-none focus:border-[#ff4f18] focus:ring-2 focus:ring-[#ff4f1820]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#77736c]">Proposal ID</label>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="created after proposal" className="mt-2 w-full rounded-[9px] border border-[#e1ded7] bg-[#f7f6f3] p-3 outline-none" />
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <button onClick={createProposal} className="rounded-[10px] bg-[#f2f0ec] px-4 py-3 text-[13px] font-bold">
              Quote and create proposal
            </button>
            <button onClick={executeProposal} className="rounded-[10px] bg-[#101114] px-4 py-3 text-[13px] font-bold text-white">
              Execute approved proposal
            </button>
          </div>
          <p className="mt-4 min-h-[20px] text-[13px] text-[#ef4b19]">{quoteResult}</p>
        </article>

        <article className="rounded-2xl border border-[#e3dfd7] bg-white p-6">
          <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">GOVERNANCE</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Vote on a proposal</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#77736c]">Use the proposal ID posted by CIRCLA in Telegram.</p>
          <label className="mt-4 block text-[11px] font-bold text-[#77736c]">Proposal ID</label>
          <input value={proposalId} onChange={(e) => setProposalId(e.target.value)} className="mt-2 w-full rounded-[9px] border border-[#e1ded7] bg-[#f7f6f3] p-3 outline-none" />
          <div className="mt-4 flex gap-2">
            <button onClick={() => vote(true)} className="rounded-[10px] bg-[#101114] px-4 py-3 text-[13px] font-bold text-white">
              Vote yes
            </button>
            <button onClick={() => vote(false)} className="rounded-[10px] bg-[#f2f0ec] px-4 py-3 text-[13px] font-bold">
              Vote no
            </button>
          </div>
        </article>

        <article className="col-span-2 rounded-2xl border border-[#e3dfd7] bg-white p-6 max-md:col-span-1">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.14em] text-[#ff4f18]">WITHDRAWAL</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Exit with a wallet check</h2>
            </div>
            <span className="rounded-full bg-[#f1f0ed] px-3 py-2 text-[10px] font-extrabold tracking-widest text-[#77736c]">ELIGIBILITY AWARE</span>
          </div>
          <p className="mt-2 max-w-[520px] text-sm leading-relaxed text-[#77736c]">Direct B20 delivery requires an authorized recipient. The vault also supports a guarded USDC liquidation path for blocked recipients.</p>
          <div className="mt-4 grid grid-cols-[1fr_2fr_auto] items-end gap-3 max-md:grid-cols-1">
            <div>
              <label className="block text-[11px] font-bold text-[#77736c]">Claim units</label>
              <input value={units} onChange={(e) => setUnits(e.target.value)} className="mt-2 w-full rounded-[9px] border border-[#e1ded7] bg-[#f7f6f3] p-3 outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#77736c]">Recipient</label>
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x..." className="mt-2 w-full rounded-[9px] border border-[#e1ded7] bg-[#f7f6f3] p-3 outline-none" />
            </div>
            <button onClick={withdraw} className="rounded-[10px] bg-[#f2f0ec] px-4 py-3 text-[13px] font-bold">
              Withdraw B20
            </button>
          </div>
        </article>
      </section>

      <footer className="flex justify-between gap-5 px-0.5 pt-6 text-[11px] text-[#918d85] max-md:flex-col">
        <span>Coinbase Tokenized Stocks are available only to eligible users in permitted non-US jurisdictions.</span>
        <span className={isError ? "text-[#c33b24]" : ""}>{activity}</span>
      </footer>
    </main>
  );
}
