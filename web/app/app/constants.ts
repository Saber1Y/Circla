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