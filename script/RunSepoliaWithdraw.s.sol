// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {CirclaVault} from "../src/CirclaVault.sol";
import {CirclaTestB20, CirclaTestUSDC, CirclaTestRouter} from "../src/mocks/CirclaTestAssets.sol";

contract RunSepoliaWithdraw is Script {
    function run() external {
        uint256 aliceKey = vm.envUint("ALICE_PRIVATE_KEY");
        address vaultAddr = vm.envAddress("CIRCLA_VAULT_ADDRESS");
        address usdcAddr = vm.envAddress("CIRCLA_USDC_ADDRESS");
        address stockAddr = vm.envAddress("CIRCLA_STOCK_ADDRESS");
        address routerAddr = vm.envAddress("CIRCLA_ROUTER_ADDRESS");
        address recipient = vm.envOr("WITHDRAW_RECIPIENT", vm.addr(aliceKey));

        CirclaVault vault = CirclaVault(vaultAddr);
        CirclaTestUSDC usdc = CirclaTestUSDC(usdcAddr);
        CirclaTestB20 stock = CirclaTestB20(stockAddr);

        address alice = vm.addr(aliceKey);
        console2.log("Alice:", alice);
        console2.log("Vault:", vaultAddr);
        console2.log("Recipient:", recipient);
        console2.log("Alice units:", vault.memberUnits(alice));
        console2.log("PoolValue:", vault.poolValue());
        console2.log("Vault USDC:", usdc.balanceOf(vaultAddr));
        console2.log("Vault stock:", stock.balanceOf(vaultAddr));

        uint256 aliceUnits = vault.memberUnits(alice);
        uint256 withdrawUnits = aliceUnits / 2;
        console2.log("Withdrawing units:", withdrawUnits);

        // Direct withdraw to self (policy 0 => authorized)
        vm.startBroadcast(aliceKey);
        (uint256 usdcOut, uint256 stockOut) = vault.withdraw(withdrawUnits, recipient);
        vm.stopBroadcast();
        console2.log("Direct withdraw USDC:", usdcOut);
        console2.log("Direct withdraw stock:", stockOut);
        console2.log("Post withdraw poolValue:", vault.poolValue());
        console2.log("Alice remaining units:", vault.memberUnits(alice));
        console2.log("Recipient USDC:", usdc.balanceOf(recipient));
        console2.log("Recipient stock:", stock.balanceOf(recipient));

        // Now test liquidation path: set policy to non-zero, try withdrawAsUSDC to unauthorized
        // Mint more stock to vault for liquidation test if needed
        if (vault.memberUnits(alice) > 0) {
            // Set receiver policy to 7 (non-zero, so isAuthorized checks mapping)
            vm.startBroadcast(aliceKey);
            stock.setReceiverPolicy(7);
            vm.stopBroadcast();
            console2.log("Set stock receiverPolicy to 7");

            address blockedRecipient =
                vm.envOr("BLOCKED_RECIPIENT", address(0x2222222222222222222222222222222222222222));
            console2.log("Blocked recipient:", blockedRecipient);

            uint256 remainingUnits = vault.memberUnits(alice);
            uint256 liqUnits = remainingUnits / 2;

            // Get quote for liquidation
            uint256 liqQuote =
                CirclaTestRouter(routerAddr).quote(stock.balanceOf(vaultAddr) * liqUnits / vault.totalUnits(), stockAddr);
            uint256 minOut = liqQuote * 9900 / 10000;
            console2.log("Liquidation quote minOut:", minOut);

            vm.startBroadcast(aliceKey);
            uint256 totalUsdc = vault.withdrawAsUSDC(liqUnits, blockedRecipient, routerAddr, minOut);
            vm.stopBroadcast();
            console2.log("Liquidation withdraw total USDC:", totalUsdc);
            console2.log("Blocked recipient USDC:", usdc.balanceOf(blockedRecipient));
            console2.log("Final poolValue:", vault.poolValue());
        }
    }
}
