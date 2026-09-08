// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {CirclaAssetRegistry} from "../src/CirclaAssetRegistry.sol";

/// @notice Fork test: run the same configureAsset calls ConfigureAssets.s.sol
/// makes, as the real owner, and confirm each lands enabled. Proves the script
/// won't hit InvalidPriceFeed on live Base.
/// @dev Mirrors the script: only the 7 pool-backed assets are enabled (NVDAc is
/// already enabled on the live registry). SNDKc, TSLAc, COINc, CRCLc, and INTCc
/// have no Aerodrome /USDC pool yet and must stay disabled.
contract CirclaConfigureForkTest is Test {
    CirclaAssetRegistry internal constant REGISTRY = CirclaAssetRegistry(0xA433d976740203bAE030339e68d6f7b261aCEABd);
    address internal constant OWNER = 0x62f5a416c0077472822B3Ceb60bA2A6577D68784;

    address internal constant METAC = 0xb2000000000000000000008bC8786B856E61707C;
    address internal constant AAPLC = 0xb200000000000000000000C2e324d24d7eEcd1fb;
    address internal constant GOOGLC = 0xb2000000000000000000002D0BA3164cc74f58B7;
    address internal constant AMZNC = 0xb200000000000000000000d9192b6B456483C2E8;
    address internal constant MSFTC = 0xB200000000000000000000Ab99cFa739E253872B;
    address internal constant MSTRC = 0xb2000000000000000000004884b426556b92883d;
    address internal constant SPCXC = 0xb2000000000000000000007b9fcbd005511aCBd5;

    address internal constant METAC_FEED = 0x6526aE6797A76123638b863AeE4dD27Ba4E4b27D;
    address internal constant AAPLC_FEED = 0x787f13dEa48Db0897CbCDD985de77809D837F988;
    address internal constant GOOGLC_FEED = 0x5bF49E0ffA937CE2FfF033c739aD7C634c4D34F2;
    address internal constant AMZNC_FEED = 0x06A8E4b3aBB3B7543d8396FB2B763d22820cB295;
    address internal constant MSFTC_FEED = 0xeB10A6c9aa7E537aEd766C08c35Dae35B321b18c;
    address internal constant MSTRC_FEED = 0xB3cE282CD188b35DA0E38D8Bc7d58e33173D202a;
    address internal constant SPCXC_FEED = 0x6A634B235903C4ad6376892180d6fF8612e3Fa68;

    // No /USDC Slipstream pool yet — the script skips these, so they must stay disabled.
    address internal constant SNDKC = 0xb200000000000000000000397293Cb8cda9a10c5;
    address internal constant TSLAC = 0xb2000000000000000000001e800a7f5189430cD0;
    address internal constant COINC = 0xb200000000000000000000c85a31389D71F3ecfb;
    address internal constant CRCLC = 0xB20000000000000000000019f6E7C675b73C2e4D;
    address internal constant INTCC = 0xB2000000000000000000004AFF16039bA04bdFBc;

    function testConfigurePoolBackedAssetsAsOwner() external {
        string memory rpc = vm.envOr("BASE_FORK_RPC_URL", string(""));
        if (bytes(rpc).length == 0) {
            vm.skip(true);
        }
        vm.createSelectFork(rpc);
        assertEq(REGISTRY.owner(), OWNER, "owner must be deployer to run script");

        vm.prank(OWNER);
        REGISTRY.configureAsset(METAC, METAC_FEED, 8, 10, 100_000_000, true);
        vm.prank(OWNER);
        REGISTRY.configureAsset(AAPLC, AAPLC_FEED, 8, 10, 100_000_000, true);
        vm.prank(OWNER);
        REGISTRY.configureAsset(GOOGLC, GOOGLC_FEED, 8, 10, 100_000_000, true);
        vm.prank(OWNER);
        REGISTRY.configureAsset(AMZNC, AMZNC_FEED, 8, 10, 100_000_000, true);
        vm.prank(OWNER);
        REGISTRY.configureAsset(MSFTC, MSFTC_FEED, 8, 10, 100_000_000, true);
        vm.prank(OWNER);
        REGISTRY.configureAsset(MSTRC, MSTRC_FEED, 8, 10, 100_000_000, true);
        vm.prank(OWNER);
        REGISTRY.configureAsset(SPCXC, SPCXC_FEED, 8, 10, 100_000_000, true);

        assertTrue(REGISTRY.getAsset(METAC).enabled);
        assertTrue(REGISTRY.getAsset(AAPLC).enabled);
        assertTrue(REGISTRY.getAsset(GOOGLC).enabled);
        assertTrue(REGISTRY.getAsset(AMZNC).enabled);
        assertTrue(REGISTRY.getAsset(MSFTC).enabled);
        assertTrue(REGISTRY.getAsset(MSTRC).enabled);
        assertTrue(REGISTRY.getAsset(SPCXC).enabled);

        assertFalse(REGISTRY.getAsset(SNDKC).enabled, "SNDKc has no /USDC pool yet");
        assertFalse(REGISTRY.getAsset(TSLAC).enabled, "TSLAc has no /USDC pool yet");
        assertFalse(REGISTRY.getAsset(COINC).enabled, "COINc has no /USDC pool yet");
        assertFalse(REGISTRY.getAsset(CRCLC).enabled, "CRCLc has no /USDC pool yet");
        assertFalse(REGISTRY.getAsset(INTCC).enabled, "INTCc has no /USDC pool yet");
    }
}
