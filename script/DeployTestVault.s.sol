// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {CirclaVault} from "../src/CirclaVault.sol";

// Deploys a fresh CirclaVault that REUSES the live onchain asset registry
// (all 8 pool-backed stocks already enabled) and the B20 precompile policy
// registry. Owner = deployer key. Nothing is configured on the registry here.
contract DeployTestVault is Script {
    function run() external returns (address vault) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        address registry = 0xA433d976740203bAE030339e68d6f7b261aCEABd;
        address policyRegistry = 0x8453000000000000000000000000000000000002;
        vm.startBroadcast(deployerKey);
        vault = address(new CirclaVault(
            deployer,
            usdc,
            registry,
            policyRegistry,
            "Circla Test Vault",
            100,
            1,
            1000000000000,
            100000000000,
            86400
        ));
        vm.stopBroadcast();
    }
}
