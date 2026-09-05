// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CirclaAssetRegistry} from "../src/CirclaAssetRegistry.sol";
import {CirclaVault} from "../src/CirclaVault.sol";

contract ForkMockB20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function decimals() external pure returns (uint8) {
        return 8;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function scaledBalanceOf(address account) external view returns (uint256) {
        return balanceOf[account];
    }

    function policyId(bytes32) external pure returns (uint64) {
        return 0;
    }
}

interface IQuoterV2Like {
    struct QuoteExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        int24 tickSpacing;
        uint160 sqrtPriceLimitX96;
    }

    function quoteExactInputSingle(QuoteExactInputSingleParams calldata params)
        external
        returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate);
}

/// @notice Proves the vault executes against the REAL Aerodrome Slipstream
/// router and the live USDC/NVDAc pool on a Base mainnet fork.
/// @dev Run with: forge test --fork-url https://mainnet.base.org --match-contract CirclaVaultForkTest
contract CirclaVaultForkTest is Test {
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant NVDAC = 0xb20000000000000000000078ee7ce2fE4908108C;
    address constant NVDA_FEED = 0x04689a41629776563E6822F76f2e57D148d28513;
    address constant POLICY_REGISTRY = 0x8453000000000000000000000000000000000002;
    address constant SLIPSTREAM_ROUTER = 0x698Cb2b6dd822994581fEa6eA4Fc755d1363A92F;
    address constant QUOTER_V2 = 0x514c8B5f54112481E28028F1166Bd78501089259;
    address constant NVDA_USDC_POOL = 0x853F5f1B92b16714Fe6CDA67CAad0856B83C7ab9;
    int24 constant NVDA_TICK_SPACING = 10;

    CirclaAssetRegistry registry;
    CirclaVault vault;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        // Fork tests need a live RPC; plain `forge test` skips them.
        // Run with: BASE_FORK_RPC_URL=https://mainnet.base.org forge test --match-contract CirclaVaultForkTest
        string memory rpc = vm.envOr("BASE_FORK_RPC_URL", string(""));
        if (bytes(rpc).length == 0) {
            vm.skip(true);
        }
        vm.createSelectFork(rpc);
        // B20 assets are chain-native precompiles with no bytecode, which revm
        // cannot execute. Etch equivalent accounting onto the real address so the
        // REAL Slipstream router, pool, and quoter run unmodified on the fork.
        // Pool math (slot0, ticks, liquidity) stays real; only the token ledger
        // is mocked, so fund the pool's etched balance to cover payouts.
        vm.etch(NVDAC, address(new ForkMockB20()).code);
        deal(NVDAC, NVDA_USDC_POOL, 100e8);
        registry = new CirclaAssetRegistry(address(this));
        registry.configureAsset(NVDAC, NVDA_FEED, 8, NVDA_TICK_SPACING, 1_000e6, true);
        registry.setRouter(SLIPSTREAM_ROUTER, true);
        vault = new CirclaVault(
            address(this),
            USDC,
            address(registry),
            POLICY_REGISTRY,
            "Mainnet Fork Circle",
            3,
            2,
            100e6,
            1_000e6,
            1 hours
        );
        deal(USDC, alice, 100e6);
        deal(USDC, bob, 100e6);
        vm.prank(alice);
        vault.join();
        vm.prank(bob);
        vault.join();
    }

    function testForkBuysRealNVDAcViaSlipstream() public {
        vm.startPrank(alice);
        IERC20(USDC).approve(address(vault), 50e6);
        vault.deposit(50e6);
        vm.stopPrank();
        vm.startPrank(bob);
        IERC20(USDC).approve(address(vault), 50e6);
        vault.deposit(50e6);
        vm.stopPrank();

        // Offchain-style quote via the live QuoterV2, 2% safety buffer as min out.
        (uint256 quoted,,,) = IQuoterV2Like(QUOTER_V2).quoteExactInputSingle(
            IQuoterV2Like.QuoteExactInputSingleParams({
                tokenIn: USDC,
                tokenOut: NVDAC,
                amountIn: 40e6,
                tickSpacing: NVDA_TICK_SPACING,
                sqrtPriceLimitX96: 0
            })
        );
        assertGt(quoted, 0, "no Slipstream liquidity");
        uint256 minOut = quoted * 9800 / 10000;

        vm.prank(alice);
        uint256 proposalId = vault.createProposal(NVDAC, SLIPSTREAM_ROUTER, 40e6, minOut);
        vm.prank(alice);
        vault.vote(proposalId, true);
        vm.prank(bob);
        vault.vote(proposalId, true);

        vm.prank(alice);
        uint256 amountOut = vault.executeProposal(SLIPSTREAM_ROUTER, proposalId, NVDA_TICK_SPACING);

        assertGe(amountOut, minOut, "slippage protection violated");
        assertEq(IERC20(NVDAC).balanceOf(address(vault)), amountOut, "vault must custody real B20");
        assertGt(vault.poolValue(), 0, "portfolio must price via Chainlink feed");
    }
}
