// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {CirclaAssetRegistry} from "../src/CirclaAssetRegistry.sol";
import {CirclaVault} from "../src/CirclaVault.sol";

contract Deploy is Script {
    function run() external returns (CirclaAssetRegistry registry, CirclaVault vault) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address usdc = vm.envAddress("BASE_USDC");
        address policyRegistry = vm.envAddress("B20_POLICY_REGISTRY");
        address stock = vm.envAddress("CIRCLA_STOCK_TOKEN");
        address priceFeed = vm.envAddress("CIRCLA_STOCK_FEED");
        address router = vm.envAddress("AERODROME_ROUTER");

        vm.startBroadcast(deployerKey);
        registry = new CirclaAssetRegistry(deployer);
        registry.configureAsset(
            stock, priceFeed, uint8(vm.envUint("CIRCLA_STOCK_DECIMALS")), vm.envUint("MAX_TRADE_AMOUNT"), true
        );
        registry.setRouter(router, true);
        vault = new CirclaVault(
            deployer,
            usdc,
            address(registry),
            policyRegistry,
            vm.envString("CIRCLA_CIRCLE_NAME"),
            uint8(vm.envUint("CIRCLA_MAX_MEMBERS")),
            uint8(vm.envUint("CIRCLA_QUORUM")),
            vm.envUint("CIRCLA_CONTRIBUTION_TARGET"),
            vm.envUint("MAX_TRADE_AMOUNT"),
            vm.envUint("PROPOSAL_TTL")
        );
        vm.stopBroadcast();
    }
}
