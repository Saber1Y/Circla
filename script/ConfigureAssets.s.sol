// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {CirclaAssetRegistry} from "../src/CirclaAssetRegistry.sol";

/// @notice Enable additional official Coinbase B20 stocks on the live mainnet
/// registry so the vault can propose and execute swaps for them.
/// @dev Run as the registry owner (deployer). Uses verified Chainlink
/// total-return feed proxies from docs.base.org (Sep 2026) and the same
/// tickSpacing (10) and maxTradeAmount as the already-configured NVDAc.
contract ConfigureAssets is Script {
    CirclaAssetRegistry internal constant REGISTRY =
        CirclaAssetRegistry(0xA433d976740203bAE030339e68d6f7b261aCEABd);

    // Official B20 token -> verified Coinbase Chainlink total-return feed (Base).
    address internal constant NVDAC = 0xb20000000000000000000078ee7ce2fE4908108C;
    address internal constant NVDAC_FEED = 0x04689a41629776563E6822F76f2e57D148d28513;
    address internal constant METAC = 0xb2000000000000000000008bC8786B856E61707C;
    address internal constant METAC_FEED = 0x6526aE6797A76123638b863AeE4dD27Ba4E4b27D;
    address internal constant AAPLC = 0xb200000000000000000000C2e324d24d7eEcd1fb;
    address internal constant AAPLC_FEED = 0x787f13dEa48Db0897CbCDD985de77809D837F988;
    address internal constant GOOGLC = 0xb2000000000000000000002D0BA3164cc74f58B7;
    address internal constant GOOGLC_FEED = 0x5bF49E0ffA937CE2FfF033c739aD7C634c4D34F2;
    address internal constant AMZNC = 0xb200000000000000000000d9192b6B456483C2E8;
    address internal constant AMZNC_FEED = 0x06A8E4b3aBB3B7543d8396FB2B763d22820cB295;
    address internal constant MSFTC = 0xB200000000000000000000Ab99cFa739E253872B;
    address internal constant MSFTC_FEED = 0xeB10A6c9aa7E537aEd766C08c35Dae35B321b18c;
    address internal constant MSTRC = 0xb2000000000000000000004884b426556b92883d;
    address internal constant MSTRC_FEED = 0xB3cE282CD188b35DA0E38D8Bc7d58e33173D202a;
    address internal constant SNDKC = 0xb200000000000000000000397293Cb8cda9a10c5;
    address internal constant SNDKC_FEED = 0x388b0dC46C0Fb05A74BeE0994fa5b02c6Fcca2eA;
    address internal constant SPCXC = 0xb2000000000000000000007b9fcbd005511aCBd5;
    address internal constant SPCXC_FEED = 0x6A634B235903C4ad6376892180d6fF8612e3Fa68;
    address internal constant TSLAC = 0xb2000000000000000000001e800a7f5189430cD0;
    address internal constant TSLAC_FEED = 0xFaf869185383a24F8cb00e27BdA6b63B9905DCb4;
    address internal constant COINC = 0xb200000000000000000000c85a31389D71F3ecfb;
    address internal constant COINC_FEED = 0x408e44f504A7371a345F03a73dDC96A4b48e8aa7;
    address internal constant CRCLC = 0xB20000000000000000000019f6E7C675b73C2e4D;
    address internal constant CRCLC_FEED = 0x0231cF2635D1E17bB5c2462cc7504Ba1fBd61f33;
    address internal constant INTCC = 0xB2000000000000000000004AFF16039bA04bdFBc;
    address internal constant INTCC_FEED = 0xAB657C39bac0D5886250D70849e2E3E008F2EECB;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        // Matches the live NVDAc config: 8 decimals (B20 standard), tick 10, max 1000 USDC.
        configure(METAC, METAC_FEED);
        configure(AAPLC, AAPLC_FEED);
        configure(GOOGLC, GOOGLC_FEED);
        configure(AMZNC, AMZNC_FEED);
        configure(MSFTC, MSFTC_FEED);
        configure(MSTRC, MSTRC_FEED);
        configure(SNDKC, SNDKC_FEED);
        configure(SPCXC, SPCXC_FEED);
        configure(TSLAC, TSLAC_FEED);
        configure(COINC, COINC_FEED);
        configure(CRCLC, CRCLC_FEED);
        configure(INTCC, INTCC_FEED);

        vm.stopBroadcast();
    }

    function configure(address token, address feed) internal {
        CirclaAssetRegistry.AssetConfig memory cfg = REGISTRY.getAsset(token);
        if (cfg.enabled) return;
        REGISTRY.configureAsset(token, feed, 8, 10, 100_000_000, true);
    }
}