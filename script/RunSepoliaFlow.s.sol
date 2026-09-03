// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {CirclaVault} from "../src/CirclaVault.sol";
import {CirclaTestUSDC, CirclaTestB20} from "../src/mocks/CirclaTestAssets.sol";
import {IAerodromeRouterLike} from "../src/interfaces/CirclaInterfaces.sol";

contract RunSepoliaFlow is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        uint256 aliceKey = vm.envOr("ALICE_PRIVATE_KEY", deployerKey);
        address vaultAddr = vm.envAddress("CIRCLA_VAULT_ADDRESS");
        address usdcAddr = vm.envAddress("CIRCLA_USDC_ADDRESS");
        address stockAddr = vm.envAddress("CIRCLA_STOCK_ADDRESS");
        address routerAddr = vm.envAddress("CIRCLA_ROUTER_ADDRESS");

        address deployer = vm.addr(deployerKey);
        address alice = vm.addr(aliceKey);

        console2.log("Deployer:", deployer);
        console2.log("Alice:", alice);
        console2.log("Vault:", vaultAddr);
        console2.log("USDC:", usdcAddr);
        console2.log("Stock:", stockAddr);
        console2.log("Router:", routerAddr);

        CirclaVault vault = CirclaVault(vaultAddr);
        CirclaTestUSDC usdc = CirclaTestUSDC(usdcAddr);
        CirclaTestB20 stock = CirclaTestB20(stockAddr);

        // If vault not joined by deployer, join with deployer
        if (!vault.isMember(deployer)) {
            vm.startBroadcast(deployerKey);
            vault.join();
            vm.stopBroadcast();
            console2.log("Deployer joined");
        }

        if (alice != deployer && !vault.isMember(alice)) {
            // Fund alice with ETH if needed - deployer sends 0.005 ETH
            vm.startBroadcast(deployerKey);
            (bool ok,) = alice.call{value: 0.005 ether}("");
            require(ok, "fund alice failed");
            vm.stopBroadcast();
            console2.log("Funded alice with 0.005 ETH");

            // Mint tUSDC to alice
            vm.startBroadcast(deployerKey);
            // CirclaTestUSDC mint is permissionless, but we broadcast as deployer for simplicity
            // Actually mint directly as any sender works, use deployer
            usdc.mint(alice, 200e6);
            vm.stopBroadcast();
            console2.log("Minted 200 tUSDC to alice, balance:", usdc.balanceOf(alice));

            vm.startBroadcast(aliceKey);
            vault.join();
            vm.stopBroadcast();
            console2.log("Alice joined");
        }

        // Deposit 50 tUSDC each
        vm.startBroadcast(deployerKey);
        usdc.approve(vaultAddr, 50e6);
        vault.deposit(50e6);
        vm.stopBroadcast();
        console2.log("Deployer deposited 50 tUSDC, poolValue:", vault.poolValue(), "totalUnits:", vault.totalUnits());

        if (alice != deployer) {
            vm.startBroadcast(aliceKey);
            usdc.approve(vaultAddr, 50e6);
            vault.deposit(50e6);
            vm.stopBroadcast();
            console2.log("Alice deposited 50 tUSDC, poolValue:", vault.poolValue());
        }

        // Create proposal: buy 80 tUSDC of stock with 1% slippage
        uint256 amountIn = 80e6;
        IAerodromeRouterLike.Route[] memory routes = new IAerodromeRouterLike.Route[](1);
        routes[0] = IAerodromeRouterLike.Route({from: usdcAddr, to: stockAddr, stable: false, factory: address(0)});
        // Use router getAmountsOut via static call
        uint256 quoted = 800000; // 80e6 * 1e6 / 100e6 = 800k (8 decimals? stock is 8 decimals, usdc 6 => 80e6 USDC -> 0.8e6 stock? Actually router does amount *1e6/100e6)
        // Query live quote if router supports it
        try IAerodromeRouterLike(routerAddr).getAmountsOut(amountIn, routes) returns (uint256[] memory amounts) {
            quoted = amounts[amounts.length - 1];
            console2.log("Live quote:", quoted);
        } catch {
            console2.log("Using fallback quote:", quoted);
        }
        uint256 minOut = quoted * 9900 / 10000; // 1% slippage

        vm.startBroadcast(deployerKey);
        uint256 proposalId = vault.createProposal(stockAddr, routerAddr, amountIn, minOut);
        vm.stopBroadcast();
        console2.log("Proposal created:", proposalId);
        console2.log("amountIn:", amountIn);
        console2.log("minOut:", minOut);

        vm.startBroadcast(deployerKey);
        vault.vote(proposalId, true);
        vm.stopBroadcast();
        console2.log("Deployer voted yes");

        if (alice != deployer) {
            vm.startBroadcast(aliceKey);
            vault.vote(proposalId, true);
            vm.stopBroadcast();
            console2.log("Alice voted yes");
        }

        vm.startBroadcast(deployerKey);
        uint256 amountOut = vault.executeProposal(routerAddr, proposalId, routes);
        vm.stopBroadcast();
        console2.log("Executed proposal, amountOut:", amountOut);
        console2.log("Final poolValue:", vault.poolValue());
        console2.log("Vault USDC:", usdc.balanceOf(vaultAddr));
        console2.log("Vault stock raw:", stock.balanceOf(vaultAddr));
        console2.log("Vault stock scaled:", stock.scaledBalanceOf(vaultAddr));
        console2.log("Deployer claim:", vault.memberClaim(deployer));
        if (alice != deployer) console2.log("Alice claim:", vault.memberClaim(alice));
    }
}
