import { parseAbi } from "viem";

export const USDC = process.env.NEXT_PUBLIC_CIRCLA_USDC_ADDRESS ?? "";
export const NVDAc = process.env.NEXT_PUBLIC_CIRCLA_STOCK_ADDRESS ?? "";
export const ROUTER = process.env.NEXT_PUBLIC_CIRCLA_ROUTER_ADDRESS ?? "";
export const REGISTRY = "0xA433d976740203bAE030339e68d6f7b261aCEABd";
export const EXPLORER = "https://basescan.org";

export const vaultAbi = parseAbi([
  "function circleName() view returns (string)",
  "function members() view returns (address[])",
  "function poolValue() view returns (uint256)",
  "function totalUnits() view returns (uint256)",
  "function portfolioAsset() view returns (address)",
  "function adjustedAssetBalance() view returns (uint256)",
  "function proposalCount() view returns (uint256)",
  "function quorum() view returns (uint8)",
  "function contributionTarget() view returns (uint256)",
  "function memberUnits(address) view returns (uint256)",
  "function isMember(address) view returns (bool)",
  "function proposals(uint256) view returns (address proposer, address asset, address router, uint256 amountIn, uint256 minAmountOut, uint256 deadline, uint256 nonce, uint256 yesVotes, uint256 noVotes, bool executed, bool cancelled)",
  "function hasVoted(uint256, address) view returns (bool)",
  "function join()",
  "function deposit(uint256 amount)",
  "function createProposal(address asset, address router, uint256 amountIn, uint256 minAmountOut) returns (uint256 proposalId)",
  "function vote(uint256 proposalId, bool support)",
  "function executeProposal(address router, uint256 proposalId, int24 tickSpacing) returns (uint256 amountOut)",
  "function withdraw(uint256 units, address recipient) returns (uint256 usdcAmount, uint256 assetAmount)",
  "function withdrawAsUSDC(uint256 units, address recipient, address router, uint256 minAmountOut) returns (uint256 totalUsdc)",
]);

export const usdcAbi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address, address) view returns (uint256)",
]);

export const registryAbi = parseAbi([
  "function getAsset(address token) view returns (address token, address priceFeed, uint8 tokenDecimals, int24 tickSpacing, uint256 maxTradeAmount, bool enabled)",
]);

export type StockMeta = { symbol: string; name: string; token: string };
export type AssetConfigTuple = [string, string, number, number, bigint, boolean];

// Official Coinbase Tokenized Stock catalog on Base, verified against
// https://www.base.org/stocks (Sep 2026) — mirrors bot/src/base-assets.mjs.
// This list is display metadata only: which stocks are actually proposable is
// decided onchain by the vault registry (enabled = true), read live per load.
export const STOCKS: StockMeta[] = [
  { symbol: "NVDAc", name: "NVIDIA", token: "0xb20000000000000000000078ee7ce2fE4908108C" },
  { symbol: "METAc", name: "Meta", token: "0xb2000000000000000000008bC8786B856E61707C" },
  { symbol: "AAPLc", name: "Apple", token: "0xb200000000000000000000C2e324d24d7eEcd1fb" },
  { symbol: "GOOGLc", name: "Alphabet (Google)", token: "0xb2000000000000000000002D0BA3164cc74f58B7" },
  { symbol: "AMZNc", name: "Amazon", token: "0xb200000000000000000000d9192b6B456483C2E8" },
  { symbol: "MSFTc", name: "Microsoft", token: "0xB200000000000000000000Ab99cFa739E253872B" },
  { symbol: "MSTRc", name: "MicroStrategy (Strategy)", token: "0xb2000000000000000000004884b426556b92883d" },
  { symbol: "SNDKc", name: "SanDisk", token: "0xb200000000000000000000397293Cb8cda9a10c5" },
  { symbol: "SPCXc", name: "SpaceX", token: "0xb2000000000000000000007b9fcbd005511aCBd5" },
  { symbol: "TSLAc", name: "Tesla", token: "0xb2000000000000000000001e800a7f5189430cD0" },
  { symbol: "COINc", name: "Coinbase", token: "0xb200000000000000000000c85a31389D71F3ecfb" },
  { symbol: "CRCLc", name: "Circle", token: "0xB20000000000000000000019f6E7C675b73C2e4D" },
  { symbol: "INTCc", name: "Intel", token: "0xB2000000000000000000004AFF16039bA04bdFBc" },
];

export function stockByToken(address?: string): StockMeta | undefined {
  if (!address) return undefined;
  const lower = address.toLowerCase();
  return STOCKS.find((s) => s.token.toLowerCase() === lower);
}