// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script} from "forge-std/Script.sol";
import {CirclaAssetRegistry} from "../src/CirclaAssetRegistry.sol";
import {CirclaVault} from "../src/CirclaVault.sol";
import {
    CirclaTestUSDC,
    CirclaTestB20,
    CirclaTestPriceFeed,
    CirclaTestPolicyRegistry,
    CirclaTestRouter
} from "../src/mocks/CirclaTestAssets.sol";

contract DeploySepoliaTestStack is Script {
    function run()
        external
        returns (
            CirclaTestUSDC usdc,
            CirclaTestB20 stock,
            CirclaTestPriceFeed feed,
            CirclaTestPolicyRegistry policies,
            CirclaTestRouter router,
            CirclaAssetRegistry registry,
            CirclaVault vault
        )
    {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        vm.startBroadcast(deployerKey);
        usdc = new CirclaTestUSDC();
        stock = new CirclaTestB20();
        feed = new CirclaTestPriceFeed();
        policies = new CirclaTestPolicyRegistry();
        router = new CirclaTestRouter(usdc, stock);
        registry = new CirclaAssetRegistry(deployer);
        registry.configureAsset(address(stock), address(feed), 8, 1_000e6, true);
        registry.setRouter(address(router), true);
        vault = new CirclaVault(
            deployer,
            address(usdc),
            address(registry),
            address(policies),
            "CIRCLA Sepolia Test Circle",
            5,
            2,
            250e6,
            1_000e6,
            30 minutes
        );
        stock.mint(address(router), 100e8);
        usdc.mint(deployer, 1_000e6);
        vm.stopBroadcast();
    }
}
