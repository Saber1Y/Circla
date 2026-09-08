"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
  type UseReadContractsParameters,
} from "wagmi";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Vote,
  Wallet,
} from "lucide-react";
import { formatUnits, isAddress, parseUnits } from "viem";
import {
  EXPLORER,
  NVDAc,
  REGISTRY,
  ROUTER,
  USDC,
  registryAbi,
  usdcAbi,
  vaultAbi,
} from "./constants";
import type { Abi } from "viem";

const telegram = () => import("@twa-dev/sdk");

type Proposal = {
  proposer: string;
  asset: string;
  router: string;
  amountIn: bigint;
  minAmountOut: bigint;
  deadline: bigint;
  nonce: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  executed: boolean;
  cancelled: boolean;
};

type ProposalsTuple = [
  proposer: string,
  asset: string,
  router: string,
  amountIn: bigint,
  minAmountOut: bigint,
  deadline: bigint,
  nonce: bigint,
  yesVotes: bigint,
  noVotes: bigint,
  executed: boolean,
  cancelled: boolean,
];

// viem decodes multi-output view returns as a tuple array, not a named object.
const toProposal = (d: unknown): Proposal | undefined => {
  if (!Array.isArray(d)) return undefined;
  const p = d as ProposalsTuple;
  return {
    proposer: p[0],
    asset: p[1],
    router: p[2],
    amountIn: p[3],
    minAmountOut: p[4],
    deadline: p[5],
    nonce: p[6],
    yesVotes: p[7],
    noVotes: p[8],
    executed: p[9],
    cancelled: p[10],
  };
};

const slice = (a: string, n = 6) => `${a.slice(0, n)}…${a.slice(-4)}`;
const errMsg = (e: unknown) =>
  ((e as { shortMessage?: string })?.shortMessage ??
    (e as Error)?.message ??
    String(e));

// The vault is supplied per-group via ?vault=0x… in the query string.
// There is deliberately no default: without a vault the app shows a notice.
const VAULT_RE = /^0x[a-fA-F0-9]{40}$/i;
const parseVault = (search: string) => {
  const v = new URLSearchParams(search).get("vault")?.trim() ?? "";
  return v && VAULT_RE.test(v) && isAddress(v) ? v : undefined;
};

export default function AppPage() {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  const [startParam, setStartParam] = useState<string>("");
  const [isTma, setIsTma] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deposit, setDeposit] = useState("25");
  const [propose, setPropose] = useState("10");
  const [slippage, setSlippage] = useState("1");
  const [tab, setTab] = useState<"vault" | "actions">("vault");

  useEffect(() => {
    let alive = true;
    telegram().then((mod) => {
      const twa = mod.default ?? mod;
      if (!alive) return;
      try {
        twa.ready();
        twa.expand();
        twa.setHeaderColor?.("#f5f3ee");
        twa.setBackgroundColor?.("#f5f3ee");
        setStartParam(twa.initDataUnsafe?.start_param ?? "");
        setIsTma(Boolean(twa.initDataUnsafe?.user?.id));
      } catch {
        /* running outside Telegram (dev) */
      }
    });
    if (typeof window !== "undefined") setParams(new URLSearchParams(window.location.search));
    return () => {
      alive = false;
    };
  }, []);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // No default vault. ?vault=0x… comes from the bot per group chat; when opened
  // through the t.me Direct Link (https://t.me/circlabasebot/circlabasebot) the
  // bot passes the vault via ?startapp=<address>, which Telegram exposes as
  // start_param in the init data. startapp only allows [A-Za-z0-9_-], so the
  // raw address is used (no "vault=" prefix).
  const rawVault = params?.get("vault")?.trim() ?? "";
  const candidate = rawVault || startParam;
  const vault: `0x${string}` | undefined =
    candidate && VAULT_RE.test(candidate) && isAddress(candidate)
      ? (candidate as `0x${string}`)
      : undefined;
  const hasVault = Boolean(vault);
  // placeholder never called because every query is vault-gated
  const V = (vault ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;

  const snapshot = useReadContracts({
    contracts: [
      { address: V, abi: vaultAbi as Abi, functionName: "circleName" },
      { address: V, abi: vaultAbi as Abi, functionName: "members" },
      { address: V, abi: vaultAbi as Abi, functionName: "totalUnits" },
      { address: V, abi: vaultAbi as Abi, functionName: "quorum" },
      { address: V, abi: vaultAbi as Abi, functionName: "portfolioAsset" },
      { address: V, abi: vaultAbi as Abi, functionName: "proposalCount" },
      { address: V, abi: vaultAbi as Abi, functionName: "poolValue" },
      { address: V, abi: vaultAbi as Abi, functionName: "adjustedAssetBalance" },
      { address: NVDAc as `0x${string}`, abi: registryAbi as Abi, functionName: "getAsset", args: [NVDAc as `0x${string}`] },
    ] as UseReadContractsParameters["contracts"],
    query: { enabled: hasVault },
  });

  const [
    nameRes, membersRes, totalUnitsRes, quorumRes, portfolioRes,
    proposalCountRes, poolValueRes, adjustedRes, assetRes,
  ] = snapshot.data ?? [];

  const proposalCount = (proposalCountRes?.result as bigint | undefined) ?? 0n;
  const isMember = useMemo(() => {
    const members = (membersRes?.result as string[] | undefined) ?? [];
    return address ? members.some((m) => m.toLowerCase() === address.toLowerCase()) : false;
  }, [membersRes?.result, address]);

  const myUnits = useReadContract({
    address: V,
    abi: vaultAbi as Abi,
    functionName: "memberUnits",
    args: [address as `0x${string}`],
    query: { enabled: Boolean(address && isMember && hasVault) },
  });

  const latestProposal = useReadContract({
    address: V,
    abi: vaultAbi as Abi,
    functionName: "proposals",
    args: [proposalCount],
    query: { enabled: proposalCount > 0n && hasVault },
  });

  const usdcBalance = useReadContract({
    address: USDC as `0x${string}`,
    abi: usdcAbi as Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: { enabled: Boolean(address) },
  });

  const usdcAllowance = useReadContract({
    address: USDC as `0x${string}`,
    abi: usdcAbi as Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, V],
    query: { enabled: Boolean(address && hasVault) },
  });

  const proposal: Proposal | undefined = toProposal(latestProposal.data);
  const poolValue = poolValueRes?.result as bigint | undefined;
  const assetConfig = assetRes?.result as
    | [string, string, number, number, bigint, boolean]
    | undefined;

  const refresh = () => {
    snapshot.refetch();
    myUnits.refetch();
    latestProposal.refetch();
    usdcBalance.refetch();
    usdcAllowance.refetch();
  };

  if (params === null) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-[#f5f3ee] px-8 text-center text-[#57534e]">
        <Loader2 size={20} className="animate-spin" />
        <p className="mt-3 text-[13px]">Loading circle…</p>
      </div>
    );
  }

  if (!hasVault) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-[#f5f3ee] px-8 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#e3dfd7] bg-white">
          <Lock size={20} />
        </div>
        <h2 className="mt-4 text-[19px] font-semibold tracking-[-0.01em] text-[#101114]">
          No circle selected
        </h2>
        <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#57534e]">
          Open this Mini App from your CIRCLA group to load that circle&apos;s vault.
          Each group has its own vault - there is no shared default.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-[#f5f3ee] text-[#101114]">
      <Header
        name={(nameRes?.result as string | undefined) ?? "CIRCLA pool"}
        members={(membersRes?.result as string[] | undefined)?.length ?? 0}
        onRefresh={refresh}
      />

      {!isConnected ? (
        <ConnectScreen
          onConnect={(c) => { void connect(c); }}
          connectors={connectors}
          isTma={isTma}
          vault={V}
        />
      ) : (
        <>
          <BackToModel
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            memberCount={(membersRes?.result as string[] | undefined)?.length ?? 0}
          />

          {expanded && (
            <div className="mx-4 mb-3 rounded-2xl border border-[#e3dfd7] bg-white p-4 text-[13px] leading-relaxed text-[#57534e]">
              <p className="mb-2 font-semibold text-[#101114]">How an equity tile works</p>
              <ol className="list-decimal space-y-1 pl-4">
                <li>Everyone contributes USDC into the group vault.</li>
                <li>Any member proposes a tokenized-stock purchase (e.g. NVDAc).</li>
                <li>Circle votes; quorum must pass with more yes than no.</li>
                <li>The vault buys through an allowlisted Aerodrome router.</li>
                <li>Each member&apos;s share is tracked as fractional units.</li>
                <li>Withdrawals are policy-aware (raw NVDAc or auto USDC liquidation).</li>
              </ol>
            </div>
          )}

          <Tabs tab={tab} onChange={setTab} />

          {tab === "vault" ? (
            <VaultView
              poolValue={poolValue}
              totalUnits={(totalUnitsRes?.result as bigint | undefined) ?? 0n}
              quorum={(quorumRes?.result as number | undefined) ?? 0}
              portfolio={(portfolioRes?.result as string | undefined) ?? ""}
              assetConfig={assetConfig}
              myUnits={isMember ? (myUnits.data as bigint | undefined) : undefined}
              usdcBalance={usdcBalance.data as bigint | undefined}
              isMember={isMember}
              proposal={proposal}
              maxTradeAmountUsdc={(assetConfig?.[4] ?? 100n)}
            />
          ) : (
            <ActionsView
              isMember={isMember}
              address={address}
              vault={vault}
              myUnits={isMember ? (myUnits.data as bigint | undefined) : undefined}
              proposal={proposal}
              usdcBalance={usdcBalance.data as bigint | undefined}
              usdcAllowance={usdcAllowance.data as bigint | undefined}
              asset={assetConfig}
              deposit={deposit}
              propose={propose}
              slippage={slippage}
              setDeposit={setDeposit}
              setPropose={setPropose}
              setSlippage={setSlippage}
              onSuccess={refresh}
            />
          )}

          <ConnectedFooter address={address} onDisconnect={() => disconnect()} />
        </>
      )}

      <Footer />
    </div>
  );
}

function Header({ name, members, onRefresh }: { name: string; members: number; onRefresh: () => void }) {
  return (
    <div className="border-b border-[#e3dfd7] px-4 pt-10 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#101114] text-[11px] font-bold text-white">
            C
          </span>
          <span className="text-[12px] font-semibold tracking-wide text-[#57534e]">CIRCLA</span>
        </div>
        <button
          onClick={onRefresh}
          className="grid h-8 w-8 place-items-center rounded-full border border-[#e3dfd7] bg-white text-[#57534e] hover:text-[#101114]"
          aria-label="Refresh"
        >
          <RefreshCw size={13} />
        </button>
      </div>
      <h1 className="mt-4 text-[22px] font-semibold tracking-[-0.015em]">{name}</h1>
      <p className="mt-0.5 text-[13px] text-[#57534e]">
        {members} member{members === 1 ? "" : "s"} · onchain on Base
      </p>
    </div>
  );
}

type ConnectArguments = Parameters<
  ReturnType<typeof useConnect>["connect"]
>[0];

function ConnectScreen({
  onConnect,
  connectors,
  isTma,
  vault,
}: {
  onConnect: (args: ConnectArguments) => void;
  connectors: ReturnType<typeof useConnect>["connectors"];
  isTma: boolean;
  vault: `0x${string}`;
}) {
  const continueInBrowser = () => {
    const url = `${window.location.origin}${window.location.pathname}?vault=${vault}`;
    const telegramWebApp = (
      window as Window & {
        // The @twa-dev sdk types only expose try_instant_view, but the real
        // Telegram WebApp accepts try_attempt_close_window to hand off to the
        // default browser instead of keeping the connection in the WebView.
        Telegram?: {
          WebApp?: {
            openLink?: (
              link: string,
              options?: { try_attempt_close_window?: boolean }
            ) => void;
          };
        };
      }
    ).Telegram?.WebApp;
    if (telegramWebApp?.openLink) {
      telegramWebApp.openLink(url, { try_attempt_close_window: true });
    } else {
      window.open(url, "_blank");
    }
  };

  if (isTma) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#e3dfd7] bg-white">
          <Wallet size={24} />
        </div>
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.01em]">Connect your wallet</h2>
          <p className="mt-1 max-w-[300px] text-[13px] leading-relaxed text-[#57534e]">
            Telegram blocks wallet sign-in popups, so we&apos;ll finish the connection in your
            default browser.
          </p>
        </div>
        <button
          onClick={continueInBrowser}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101114] px-5 py-3.5 text-[14px] font-semibold text-white"
        >
          Continue in browser
          <ArrowUpRight size={15} />
        </button>
        {connectors[0] && (
          <button
            onClick={() => onConnect({ connector: connectors[0]! })}
            className="text-[13px] font-medium text-[#a8a29e] underline-offset-2 hover:underline"
          >
            Try connecting here instead
          </button>
        )}
        <p className="max-w-[260px] text-[11px] leading-relaxed text-[#a8a29e]">
          No seed phrases. Smart Wallet keys are secured with Passkeys and stored on-device.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#e3dfd7] bg-white">
        <Wallet size={24} />
      </div>
      <div>
        <h2 className="text-[19px] font-semibold tracking-[-0.01em]">Connect your wallet</h2>
        <p className="mt-1 text-[13px] text-[#57534e]">
          Sign in with FaceID / Passkey. Your USDC and votes are your own onchain transactions.
        </p>
      </div>
      {connectors.map((c) => (
        <button
          key={c.id}
          onClick={() => onConnect({ connector: c })}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101114] px-5 py-3.5 text-[14px] font-semibold text-white"
        >
          Continue with {c.name}
        </button>
      ))}
      <p className="max-w-[260px] text-[11px] leading-relaxed text-[#a8a29e]">
        No seed phrases. Smart Wallet keys are secured with Passkeys and stored on-device.
      </p>
    </div>
  );
}

function BackToModel({
  expanded,
  onToggle,
  memberCount,
}: {
  expanded: boolean;
  onToggle: () => void;
  memberCount: number;
}) {
  return (
    <button
      onClick={onToggle}
      className="mx-4 mt-3 flex items-center justify-between rounded-2xl border border-[#e3dfd7] bg-white px-4 py-3 text-left"
    >
      <span className="flex items-center gap-2 text-[13px] font-semibold text-[#101114]">
        <ShieldCheck size={15} />
        {memberCount} members pool funds together
      </span>
      <ChevronRight size={15} className={`text-[#a8a29e] transition-transform ${expanded ? "rotate-90" : ""}`} />
    </button>
  );
}

function Tabs({ tab, onChange }: { tab: "vault" | "actions"; onChange: (t: "vault" | "actions") => void }) {
  return (
    <div className="mx-4 mt-3 grid grid-cols-2 gap-1 rounded-2xl border border-[#e3dfd7] bg-white p-1">
      {(["vault", "actions"] as const).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-xl px-4 py-2 text-[13px] font-semibold capitalize transition-colors ${
            tab === t ? "bg-[#101114] text-white" : "text-[#57534e]"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function VaultView({
  poolValue,
  totalUnits,
  quorum,
  portfolio,
  assetConfig,
  myUnits,
  usdcBalance,
  isMember,
  proposal,
  maxTradeAmountUsdc,
}: {
  poolValue?: bigint;
  totalUnits: bigint;
  quorum: number;
  portfolio: string;
  assetConfig?: [string, string, number, number, bigint, boolean];
  myUnits?: bigint;
  usdcBalance?: bigint;
  isMember: boolean;
  proposal?: Proposal;
  maxTradeAmountUsdc: bigint;
}) {
  const poolTxt =
    poolValue === undefined
      ? "awaiting price feed"
      : `$ ${formatUnits(poolValue, 6)}`;
  return (
    <div className="mx-4 mt-3 space-y-3 pb-4">
      <div className="rounded-3xl bg-[#101114] p-5 text-white">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Pool value</p>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/70">Base Mainnet</span>
        </div>
        <p className="mt-2 text-[34px] font-semibold leading-none tracking-[-0.02em]">{poolTxt}</p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ["Units", formatUnits(totalUnits, 18)],
            ["Quorum", String(quorum)],
            ["Members", "—"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/8 px-3 py-2.5">
              <p className="text-[10px] text-white/50">{k}</p>
              <p className="mt-0.5 text-[15px] font-semibold">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {portfolio && portfolio !== "0x0000000000000000000000000000000000000000" && (
        <div className="rounded-2xl border border-[#e3dfd7] bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold">Portfolio asset</p>
            <a
              href={`${EXPLORER}/address/${portfolio}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[12px] text-[#57534e] hover:text-[#101114]"
            >
              {slice(portfolio, 4)} <ArrowUpRight size={12} />
            </a>
          </div>
          <p className="mt-1 text-[12px] text-[#57534e]">
            NVDAc tokenized NVIDIA · max trade ${Number(maxTradeAmountUsdc)} · tick {assetConfig?.[3] ?? 60}
          </p>
        </div>
      )}

      {isMember && (
        <div className="rounded-2xl border border-[#e3dfd7] bg-white p-4">
          <p className="text-[12px] text-[#57534e]">Your share</p>
          <p className="mt-1 text-[20px] font-semibold">
            {myUnits === undefined ? "—" : `${formatUnits(myUnits, 18)} units`}
          </p>
          {usdcBalance !== undefined && (
            <p className="mt-0.5 text-[12px] text-[#57534e]">
              wallet: ${formatUnits(usdcBalance, 6)} USDC
            </p>
          )}
        </div>
      )}

      {proposal && (
        <ProposalCard proposal={proposal} quorum={quorum} compact isMember={isMember} />
      )}
    </div>
  );
}

function ActionsView({
  isMember,
  address,
  vault,
  myUnits,
  proposal,
  usdcBalance,
  usdcAllowance,
  asset,
  deposit,
  propose,
  slippage,
  setDeposit,
  setPropose,
  setSlippage,
  onSuccess,
}: {
  isMember: boolean;
  address?: string;
  vault?: `0x${string}`;
  myUnits?: bigint;
  proposal?: Proposal;
  usdcBalance?: bigint;
  usdcAllowance?: bigint;
  asset?: [string, string, number, number, bigint, boolean];
  deposit: string;
  propose: string;
  slippage: string;
  setDeposit: (v: string) => void;
  setPropose: (v: string) => void;
  setSlippage: (v: string) => void;
  onSuccess: () => void;
}) {
  return (
    <div className="mx-4 mt-3 space-y-3 pb-4">
      {!isMember ? (
        <JoinCard vault={vault} onSuccess={onSuccess} />
      ) : (
        <>
          <DepositCard
            deposit={deposit}
            setDeposit={setDeposit}
            usdcBalance={usdcBalance}
            allowance={usdcAllowance}
            vault={vault}
            onSuccess={onSuccess}
          />
          <ProposeCard
            propose={propose}
            setPropose={setPropose}
            slippage={slippage}
            setSlippage={setSlippage}
            asset={asset}
            vault={vault}
            onSuccess={onSuccess}
          />
          {proposal && (
            <ProposalCard proposal={proposal} quorum={0} isMember vault={vault} onSuccess={onSuccess} />
          )}
          <WithdrawCard
            myUnits={myUnits}
            asset={asset}
            address={address ?? ""}
            vault={vault}
            onSuccess={onSuccess}
          />
        </>
      )}
    </div>
  );
}

function JoinCard({ vault, onSuccess }: { vault?: `0x${string}`; onSuccess: () => void }) {
  const { writeContractAsync, isPending, error, data } = useWriteContract();
  const tx = useWaitForTransactionReceipt({ hash: data });
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (tx.isSuccess) onSuccess();
  }, [tx.isSuccess, onSuccess]);

  const join = async () => {
    setStatus(null);
    try {
      if (!vault) throw new Error("No circle selected.");
      await writeContractAsync({
        address: vault,
        abi: vaultAbi as Abi,
        functionName: "join",
      });
    } catch (e) {
      setStatus(errMsg(e));
    }
  };

  return (
    <div className="rounded-3xl border border-[#e3dfd7] bg-white p-5">
      <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Join the circle</h3>
      <p className="mt-1 text-[13px] text-[#57534e]">
        Sign once to become a member. Voting and contributing unlock after joining.
      </p>
      <button
        onClick={join}
        disabled={isPending || tx.isLoading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101114] py-3 text-[14px] font-semibold text-white disabled:opacity-50"
      >
        {isPending || tx.isLoading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
        {isPending ? "Confirming in wallet…" : tx.isLoading ? "Submitting…" : "Join circle"}
      </button>
      {error && <p className="mt-2 text-[12px] text-[#57534e]">{errMsg(error)}</p>}
      {status && <p className="mt-2 text-[12px] text-[#57534e]">{status}</p>}
    </div>
  );
}

function DepositCard({
  deposit,
  setDeposit,
  usdcBalance,
  allowance,
  vault,
  onSuccess,
}: {
  deposit: string;
  setDeposit: (v: string) => void;
  usdcBalance?: bigint;
  allowance?: bigint;
  vault?: `0x${string}`;
  onSuccess: () => void;
}) {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [txHash, setTxHash] = useState<string | null>(null);
  const tx = useWaitForTransactionReceipt({ hash: txHash as `0x${string}` | undefined });

  const amount = Number(deposit);
  const valid = amount > 0 && Number.isFinite(amount);
  const allowanceUsdc = allowance === undefined ? undefined : Number(allowance) / 1e6;
  const needsApprove = valid && allowanceUsdc !== undefined && amount > allowanceUsdc;
  const waiting = isPending || tx.isLoading;

  // Two-step from a smart wallet: approve, then once confirmed, deposit.
  const [approveHash, setApproveHash] = useState<string | null>(null);
  const approveTx = useWaitForTransactionReceipt({
    hash: approveHash as `0x${string}` | undefined,
  });

  useEffect(() => {
    if (approveTx.isSuccess) {
      setTxHash(null);
      setApproveHash(null);
      // approval confirmed - run the deposit step
      void runDeposit();
    }
  }, [approveTx.isSuccess]);

  const runDeposit = async () => {
    try {
      if (!vault) throw new Error("No circle selected.");
      const raw = parseUnits(deposit, 6);
      const h = await writeContractAsync({
        address: vault,
        abi: vaultAbi as Abi,
        functionName: "deposit",
        args: [raw],
      });
      setTxHash(h);
      onSuccess();
    } catch (e) {
      setTxHash(null);
      onSuccess();
      throw e as Error;
    }
  };

  const run = async () => {
    try {
      if (!vault) throw new Error("No circle selected.");
      const raw = parseUnits(deposit, 6);
      if (needsApprove) {
        const approveHash2 = await writeContractAsync({
          address: USDC as `0x${string}`,
          abi: usdcAbi as Abi,
          functionName: "approve",
          args: [vault, raw],
        });
        setTxHash(approveHash2);
        setApproveHash(approveHash2);
      } else {
        await runDeposit();
      }
    } catch (e) {
      setTxHash(null);
      onSuccess();
      throw e as Error;
    }
  };

  return (
    <Card title="Contribute USDC" icon={<Wallet size={15} />}>
      {usdcBalance !== undefined && (
        <div className="mb-2 flex items-center justify-between text-[12px] text-[#57534e]">
          <span>Wallet balance</span>
          <button onClick={() => setDeposit(formatUnits(usdcBalance, 6))} className="font-semibold text-[#101114] underline underline-offset-2">
            ${formatUnits(usdcBalance, 6)} USDC
          </button>
        </div>
      )}
      <AmountInput value={deposit} onChange={setDeposit} prefix="$" accent />
      <button
        onClick={run}
        disabled={!valid || isPending || tx.isLoading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101114] py-3 text-[14px] font-semibold text-white disabled:opacity-50"
      >
        {isPending || tx.isLoading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
        {needsApprove ? `Approve + deposit $${deposit}` : `Deposit $${deposit}`}
      </button>
      {error && <ErrText error={error} />}
    </Card>
  );
}

function ProposeCard({
  propose,
  setPropose,
  slippage,
  setSlippage,
  asset,
  vault,
  onSuccess,
}: {
  propose: string;
  setPropose: (v: string) => void;
  slippage: string;
  setSlippage: (v: string) => void;
  asset?: [string, string, number, number, bigint, boolean];
  vault?: `0x${string}`;
  onSuccess: () => void;
}) {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [txHash, setTxHash] = useState<string | null>(null);
  const tx = useWaitForTransactionReceipt({ hash: txHash as `0x${string}` | undefined });

  const feed = asset?.[1] as `0x${string}` | undefined;
  const feedDecimals = useReadContract({
    address: feed,
    abi: [{ type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] }] as Abi,
    functionName: "decimals",
    query: { enabled: Boolean(feed) },
  });
  const quote = useReadContract({
    address: feed,
    abi: [{ type: "function", name: "latestRoundData", stateMutability: "view", inputs: [], outputs: [
      { type: "uint80", name: "roundId" }, { type: "int256", name: "answer" }, { type: "uint256", name: "startedAt" },
      { type: "uint256", name: "updatedAt" }, { type: "uint80", name: "answeredInRound" },
    ] }] as Abi,
    functionName: "latestRoundData",
    query: { enabled: Boolean(feed) },
  });

  const amount = Number(propose);
  const valid = amount > 0 && Number.isFinite(amount) && amount <= 100;
  const slippagePct = Math.min(99, Math.max(0.1, Number(slippage) || 1)) / 100;

  const quoteUsd = quote.data
    ? BigInt((quote.data as readonly unknown[])[1] as bigint)
    : undefined;
  const feedDp = (feedDecimals.data as number | undefined) ?? 8;
  const tokenDp = asset?.[2] ?? 8;

  const run = async () => {
    try {
      if (!vault) throw new Error("No circle selected.");
      const amountIn = parseUnits(propose, 6);
      let minAmountOut = amountIn;
      if (quoteUsd && quoteUsd > 0n) {
        // rawNVDAc = amountInRaw * 10^(tokenDp+feedDp) / (answer * 1e6) — inverse of _assetValue.
        minAmountOut =
          (amountIn *
            BigInt(10 ** (tokenDp + feedDp))) /
          (quoteUsd * 1000000n);
        minAmountOut = (minAmountOut * BigInt(Math.round((1 - slippagePct) * 1000))) / 1000n;
      }
      const h = await writeContractAsync({
        address: vault,
        abi: vaultAbi as Abi,
        functionName: "createProposal",
        args: [NVDAc as `0x${string}`, ROUTER as `0x${string}`, amountIn, minAmountOut],
      });
      setTxHash(h);
      onSuccess();
    } catch (e) {
      setTxHash(null);
      onSuccess();
      throw e as Error;
    }
  };

  return (
    <Card title="Propose a buy" icon={<Vote size={15} />}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="mb-1 text-[11px] text-[#57534e]">Amount (USDC)</p>
          <AmountInput value={propose} onChange={setPropose} prefix="$" />
        </div>
        <div>
          <p className="mb-1 text-[11px] text-[#57534e]">Slippage</p>
          <AmountInput value={slippage} onChange={setSlippage} suffix="%" />
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#57534e]">
        <ShieldCheck size={13} className="text-[#16a34a]" /> NVDAc · allowlisted Aerodrome router · tick{" "}
        {asset?.[3] ?? 60}
        {quoteUsd && quoteUsd > 0n ? (
          <span className="ml-auto font-semibold text-[#101114]">
            ≈ {(amount / Number(quoteUsd)) * 10 ** (feedDp - tokenDp)} NVDAc
          </span>
        ) : (
          <span className="ml-auto">quoting…</span>
        )}
      </p>
      <button
        onClick={run}
        disabled={!valid || isPending || tx.isLoading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101114] py-3 text-[14px] font-semibold text-white disabled:opacity-50"
      >
        {isPending || tx.isLoading ? <Loader2 size={15} className="animate-spin" /> : <Vote size={15} />}
        {isPending ? "Confirming…" : "Create proposal"}
      </button>
      {error && <ErrText error={error} />}
    </Card>
  );
}

function ProposalCard({
  proposal,
  quorum,
  compact = false,
  isMember,
  vault,
  onSuccess,
}: {
  proposal: Proposal;
  quorum: number;
  compact?: boolean;
  isMember: boolean;
  vault?: `0x${string}`;
  onSuccess?: () => void;
}) {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [step, setStep] = useState<string | null>(null);
  const q = quorum || Number(proposal.yesVotes) || 0;

  const status = proposal.executed
    ? "executed"
    : proposal.cancelled
      ? "cancelled"
      : "awaiting votes";

  const action = async (fn: "vote" | "executeProposal", args: unknown[]) => {
    setStep(fn);
    try {
      if (!vault) throw new Error("No circle selected.");
      const h = await writeContractAsync({
        address: vault,
        abi: vaultAbi as Abi,
        functionName: fn,
        args,
      });
      onSuccess?.();
    } catch (e) {
      setStep(null);
      throw e as Error;
    }
  };

  return (
    <Card title={`Proposal #${proposal.nonce}`} icon={<Vote size={15} />}>
      <p className="text-[12px] text-[#57534e]">
        Buy <b className="text-[#101114]">${formatUnits(proposal.amountIn, 6)}</b> of NVDAc · min{" "}
        <b className="text-[#101114]">~${formatUnits(proposal.minAmountOut, 6)}</b>
      </p>
      <div className="mt-2 flex items-center justify-between text-[12px]">
        <span className="text-[#57534e]">
          ✓ {proposal.yesVotes?.toString() ?? "0"} yes · ✗ {proposal.noVotes?.toString() ?? "0"} no
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          status === "executed" ? "bg-[#dcfce7] text-[#166534]" : status === "awaiting votes" ? "bg-[#fef9c3] text-[#854d0e]" : "bg-[#f3f4f6] text-[#6b7280]"
        }`}>
          {status}
        </span>
      </div>
      {(status === "awaiting votes" || compact === false) && isMember && status === "awaiting votes" && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => action("vote", [proposal.nonce, true])}
            disabled={isPending || step === "vote"}
            className="flex-1 rounded-xl bg-[#dedfe4] py-2.5 text-[13px] font-semibold text-[#101114] disabled:opacity-50"
          >
            {step === "vote" ? <Loader2 size={14} className="mx-auto animate-spin" /> : "Vote yes"}
          </button>
          <button
            onClick={() => action("vote", [proposal.nonce, false])}
            disabled={isPending || step === "vote"}
            className="flex-1 rounded-xl border border-[#e3dfd7] py-2.5 text-[13px] font-semibold text-[#57534e] disabled:opacity-50"
          >
            {step === "vote" ? <Loader2 size={14} className="mx-auto animate-spin" /> : "Vote no"}
          </button>
        </div>
      )}
      {status === "awaiting votes" && proposal.yesVotes >= BigInt(q) && proposal.yesVotes > proposal.noVotes && isMember && (
        <button
          onClick={() => action("executeProposal", [proposal.router, proposal.nonce, 60])}
          disabled={isPending || step === "executeProposal"}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {step === "executeProposal" ? <Loader2 size={14} className="animate-spin" /> : "Execute swap"}
        </button>
      )}
      {error && <ErrText error={error} />}
    </Card>
  );
}

function WithdrawCard({
  myUnits,
  asset,
  address,
  vault,
  onSuccess,
}: {
  myUnits?: bigint;
  asset?: [string, string, number, number, bigint, boolean];
  address: string;
  vault?: `0x${string}`;
  onSuccess: () => void;
}) {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [mode, setMode] = useState<"auto" | "raw">("auto");
  const [txHash, setTxHash] = useState<string | null>(null);
  const tx = useWaitForTransactionReceipt({ hash: txHash as `0x${string}` | undefined });

  const feed = asset?.[1] as `0x${string}` | undefined;
  const quote = useReadContract({
    address: feed,
    abi: [{ type: "function", name: "latestRoundData", stateMutability: "view", inputs: [], outputs: [
      { type: "uint80", name: "roundId" }, { type: "int256", name: "answer" }, { type: "uint256", name: "startedAt" },
      { type: "uint256", name: "updatedAt" }, { type: "uint80", name: "answeredInRound" },
    ] }] as Abi,
    functionName: "latestRoundData",
    query: { enabled: Boolean(feed) },
  });

  const run = async () => {
    try {
      if (!vault) throw new Error("No circle selected.");
      setTxHash(null);
      const units = myUnits ?? 0n;
      if (mode === "raw") {
        const h = await writeContractAsync({
          address: vault,
          abi: vaultAbi as Abi,
          functionName: "withdraw",
          args: [units, address as `0x${string}`],
        });
        setTxHash(h);
      } else {
        const answer = quote.data ? (BigInt((quote.data as readonly unknown[])[1] as bigint)) : undefined;
        const tokenDp = asset?.[2] ?? 8;
        const feedDp = 8;
        let minAmountOut = 0n;
        if (answer && answer > 0n) {
          minAmountOut = (units * BigInt(10 ** (tokenDp + feedDp)) / 1_000_000n * answer) / BigInt(10 ** feedDp);
          minAmountOut = (minAmountOut * 950n) / 1000n; // 5% slippage guard
        }
        const h = await writeContractAsync({
          address: vault,
          abi: vaultAbi as Abi,
          functionName: "withdrawAsUSDC",
          args: [units, address as `0x${string}`, ROUTER as `0x${string}`, minAmountOut],
        });
        setTxHash(h);
      }
      onSuccess();
    } catch (e) {
      setTxHash(null);
      onSuccess();
      throw e as Error;
    }
  };

  return (
    <Card title="Withdraw" icon={<ArrowUpRight size={15} />}>
      <div className="flex gap-2">
        {(["auto", "raw"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold ${
              mode === m ? "bg-[#101114] text-white" : "bg-[#f5f3ee] text-[#57534e]"
            }`}
          >
            {m === "auto" ? "Auto → USDC" : "Raw NVDAc"}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[#57534e]">
        {mode === "raw"
          ? "Raw NVDAc only if your wallet clears Coinbase TRANSFER_RECEIVER_POLICY. Otherwise this reverts — use Auto → USDC."
          : "Vault liquidates your share to USDC via Aerodrome automatically. No policy check needed."}
      </p>
      <button
        onClick={run}
        disabled={!myUnits || myUnits === 0n || isPending || tx.isLoading}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101114] py-3 text-[14px] font-semibold text-white disabled:opacity-50"
      >
        {isPending || tx.isLoading ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpRight size={15} />}
        {myUnits && myUnits > 0n
          ? `Withdraw ${formatUnits(myUnits, 18)} units (${mode})`
          : "No units yet"}
      </button>
      {error && <ErrText error={error} />}
    </Card>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#e3dfd7] bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#f5f3ee] text-[#101114]">{icon}</span>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  prefix,
  suffix,
  accent = false,
}: {
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className={`flex items-center rounded-2xl border px-3.5 py-2.5 ${accent ? "border-[#101114] bg-[#101114] text-white" : "border-[#e3dfd7] bg-[#f5f3ee]"}`}>
      {prefix && <span className={`mr-2 text-[16px] font-semibold ${accent ? "text-white/60" : "text-[#57534e]"}`}>{prefix}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        inputMode="decimal"
        className={`w-full bg-transparent text-[18px] font-semibold outline-none ${accent ? "text-white placeholder-white/40" : "text-[#101114] placeholder-[#a8a29e]"}`}
        placeholder="0"
      />
      {suffix && <span className={`ml-2 text-[14px] font-semibold ${accent ? "text-white/60" : "text-[#57534e]"}`}>{suffix}</span>}
    </div>
  );
}

function ErrText({ error }: { error: Error }) {
  return <p className="mt-2 text-[12px] text-red-600">{errMsg(error)}</p>;
}

function ConnectedFooter({ address, onDisconnect }: { address?: string; onDisconnect: () => void }) {
  return (
    <div className="mx-4 mb-3 flex items-center justify-between rounded-2xl border border-[#e3dfd7] bg-white px-4 py-2.5">
      <a
        href={`${EXPLORER}/address/${address}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2 text-[12px] font-semibold text-[#101114]"
      >
        <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
        {address ? slice(address, 10) : ""}
      </a>
      <button onClick={onDisconnect} className="text-[12px] text-[#57534e] hover:text-[#101114]">
        Disconnect
      </button>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-auto border-t border-[#e3dfd7] px-4 py-4 text-center text-[11px] text-[#a8a29e]">
      Tokenized stocks available only to eligible users in permitted non-US jurisdictions.
    </div>
  );
}