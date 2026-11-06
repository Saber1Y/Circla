// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {CirclaAssetRegistry} from "../src/CirclaAssetRegistry.sol";
import {CirclaVault} from "../src/CirclaVault.sol";

// Deploys a fresh CirclaVault on Base mainnet, REUSING the live asset registry
// (all pool-backed stocks already enabled) and the B20 precompile policy
// registry. Defaults mirror the demo circle (Nairobi Tech Circle, quorum 2/5);
// override any of them with the CIRCLA_* / MAX_TRADE_AMOUNT / PROPOSAL_TTL env
// vars from .env.example.
//
// Optional:
//   CIRCLA_INVITES  comma-separated wallets invited in the same broadcast.
//   CIRCLA_OWNER    final owner; ownership moves there after invites are set.
//                   Defaults to the deployer.
//
// Run through script/deploy-mainnet.sh, which simulates first and asks before
// broadcasting.
contract DeployMainnetVault is Script {
    uint256 internal constant BASE_CHAIN_ID = 8453;
    address internal constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address internal constant REGISTRY = 0xA433d976740203bAE030339e68d6f7b261aCEABd;
    address internal constant POLICY_REGISTRY = 0x8453000000000000000000000000000000000002;
    address internal constant AERODROME_ROUTER = 0x698Cb2b6dd822994581fEa6eA4Fc755d1363A92F;
    // About 30 deploys' worth at current Base gas prices; below this the
    // broadcast can strand half-configured (deployed but not invited).
    uint256 internal constant MIN_DEPLOYER_BALANCE = 0.0002 ether;

    function run() external returns (address vault) {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address owner = vm.envOr("CIRCLA_OWNER", deployer);
        address[] memory invites = vm.envOr("CIRCLA_INVITES", ",", new address[](0));

        string memory name = vm.envOr("CIRCLA_CIRCLE_NAME", string("Nairobi Tech Circle"));
        uint256 maxMembers = vm.envOr("CIRCLA_MAX_MEMBERS", uint256(5));
        uint256 quorum = vm.envOr("CIRCLA_QUORUM", uint256(2));
        uint256 contributionTarget = vm.envOr("CIRCLA_CONTRIBUTION_TARGET", uint256(250e6));
        uint256 perTradeLimit = vm.envOr("MAX_TRADE_AMOUNT", uint256(100e6));
        uint256 proposalTtl = vm.envOr("PROPOSAL_TTL", uint256(1800));

        require(block.chainid == BASE_CHAIN_ID, "not Base mainnet (chain 8453)");
        require(REGISTRY.code.length > 0, "asset registry has no code");
        require(CirclaAssetRegistry(REGISTRY).approvedRouters(AERODROME_ROUTER), "Aerodrome router not approved");
        require(owner != address(0), "CIRCLA_OWNER is the zero address");
        require(maxMembers > 0 && maxMembers <= type(uint8).max, "CIRCLA_MAX_MEMBERS out of range");
        require(quorum > 0 && quorum <= maxMembers, "CIRCLA_QUORUM must be 1..CIRCLA_MAX_MEMBERS");
        require(invites.length <= maxMembers, "more invites than seats");
        require(perTradeLimit > 0, "MAX_TRADE_AMOUNT is zero");
        require(proposalTtl >= 5 minutes, "PROPOSAL_TTL under 5 minutes");
        require(deployer.balance >= MIN_DEPLOYER_BALANCE, "deployer needs at least 0.0002 ETH on Base");

        console2.log("deployer        ", deployer);
        console2.log("deployer ETH wei", deployer.balance);
        console2.log("final owner     ", owner);
        console2.log("circle name     ", name);
        console2.log("seats / quorum  ", maxMembers, quorum);
        console2.log("per-trade USDC  ", perTradeLimit / 1e6);
        console2.log("proposal TTL s  ", proposalTtl);
        console2.log("invites         ", invites.length);
        for (uint256 i = 0; i < invites.length; i++) {
            console2.log("  invite        ", invites[i]);
        }

        vm.startBroadcast(deployerKey);
        CirclaVault deployed = new CirclaVault(
            deployer,
            USDC,
            REGISTRY,
            POLICY_REGISTRY,
            name,
            uint8(maxMembers),
            uint8(quorum),
            contributionTarget,
            perTradeLimit,
            proposalTtl
        );
        if (invites.length > 0) deployed.setInvites(invites, true);
        if (owner != deployer) deployed.transferOwnership(owner);
        vm.stopBroadcast();

        vault = address(deployed);
        require(deployed.owner() == owner, "owner mismatch after deploy");
        for (uint256 i = 0; i < invites.length; i++) {
            require(deployed.invited(invites[i]), "invite missing after deploy");
        }
        console2.log("vault           ", vault);
    }
}
