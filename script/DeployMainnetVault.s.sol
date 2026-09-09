// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {CirclaVault} from "../src/CirclaVault.sol";

// Deploys a fresh CirclaVault running the multi-asset bytecode, REUSING the
// live onchain asset registry (all 8 pool-backed stocks already enabled) and
// the B20 precompile policy registry. Config mirrors the original mainnet
// demo vault (Nairobi Tech Circle, quorum 2/5) so the bot/Mini App repoint
// cleanly. Owner = deployer key.
contract DeployMainnetVault is Script {
    function run() external returns (address vault) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        address registry = 0xA433d976740203bAE030339e68d6f7b261aCEABd;
        address policyRegistry = 0x8453000000000000000000000000000000000002;
        vm.startBroadcast(deployerKey);
        vault = address(
            new CirclaVault(
                deployer,
                usdc,
                registry,
                policyRegistry,
                "Nairobi Tech Circle",
                5,
                2,
                250000000,
                100000000,
                1800
            )
        );
        vm.stopBroadcast();
    }
}