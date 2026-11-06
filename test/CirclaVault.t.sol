// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CirclaAssetRegistry} from "../src/CirclaAssetRegistry.sol";
import {CirclaVault} from "../src/CirclaVault.sol";
import {ISlipstreamRouterLike} from "../src/interfaces/CirclaInterfaces.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockB20 is ERC20 {
    uint256 public multiplier = 1e18;
    uint64 public policy;
    constructor() ERC20("Mock NVIDIA", "NVDAc") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setMultiplier(uint256 value) external {
        multiplier = value;
    }

    function setPolicy(uint64 value) external {
        policy = value;
    }

    function scaledBalanceOf(address account) external view returns (uint256) {
        return balanceOf(account) * multiplier / 1e18;
    }

    function policyId(bytes32) external view returns (uint64) {
        return policy;
    }
}

contract MockFeed {
    int256 public answer = 100e8;
    uint256 public updatedAt = block.timestamp;

    function decimals() external pure returns (uint8) {
        return 8;
    }

    function setAnswer(int256 value) external {
        answer = value;
        updatedAt = block.timestamp;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (1, answer, updatedAt, updatedAt, 1);
    }
}

contract MockPolicyRegistry {
    mapping(address => bool) public authorized;
    mapping(uint64 => mapping(address => bool)) public authorizedFor;

    function setAuthorized(address account, bool value) external {
        authorized[account] = value;
    }

    function setAuthorizedFor(uint64 policy, address account, bool value) external {
        authorizedFor[policy][account] = value;
    }

    function isAuthorized(uint64 policy, address account) external view returns (bool) {
        return authorized[account] || authorizedFor[policy][account];
    }
}

contract MockSlipstreamRouter {
    MockUSDC public immutable usdc;
    MockB20 public immutable stock;
    uint256 public output;

    constructor(MockUSDC usdc_, MockB20 stock_) {
        usdc = usdc_;
        stock = stock_;
    }

    function setOutput(uint256 value) external {
        output = value;
    }

    function exactInputSingle(ISlipstreamRouterLike.ExactInputSingleParams calldata params)
        external
        returns (uint256 amountOut)
    {
        amountOut = output;
        require(amountOut >= params.amountOutMinimum, "minimum output");
        require(params.tokenIn == address(usdc) || params.tokenOut == address(usdc), "unexpected pair");
        require(IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountIn), "transferFrom failed");
        require(IERC20(params.tokenOut).transfer(params.recipient, amountOut), "transfer failed");
    }
}

contract CirclaVaultTest is Test {
    MockUSDC usdc;
    MockB20 stock;
    MockB20 stock2;
    MockFeed feed;
    MockPolicyRegistry policies;
    MockSlipstreamRouter router;
    MockSlipstreamRouter router2;
    CirclaAssetRegistry registry;
    CirclaVault vault;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address recipient = address(0xCAFE);
    address mallory = address(0xBAD);

    function setUp() public {
        usdc = new MockUSDC();
        stock = new MockB20();
        stock2 = new MockB20();
        feed = new MockFeed();
        policies = new MockPolicyRegistry();
        router = new MockSlipstreamRouter(usdc, stock);
        router2 = new MockSlipstreamRouter(usdc, stock2);
        registry = new CirclaAssetRegistry(address(this));
        registry.configureAsset(address(stock), address(feed), 6, 10, 1_000e6, true);
        registry.configureAsset(address(stock2), address(feed), 6, 10, 1_000e6, true);
        registry.setRouter(address(router), true);
        registry.setRouter(address(router2), true);
        vault = new CirclaVault(
            address(this),
            address(usdc),
            address(registry),
            address(policies),
            "Nairobi Tech Circle",
            3,
            2,
            100e6,
            1_000e6,
            1 hours
        );
        usdc.mint(alice, 100e6);
        usdc.mint(bob, 100e6);
        stock.mint(address(router), 10e6);
        stock2.mint(address(router2), 10e6);
        stock2.mint(address(router), 10e6);
        address[] memory invites = new address[](2);
        invites[0] = alice;
        invites[1] = bob;
        vault.setInvites(invites, true);
        vm.prank(alice);
        vault.join();
        vm.prank(bob);
        vault.join();
    }

    function testDepositsMintEqualUnitsAtSamePrice() public {
        vm.startPrank(alice);
        usdc.approve(address(vault), 50e6);
        vault.deposit(50e6);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(vault), 50e6);
        vault.deposit(50e6);
        vm.stopPrank();

        assertEq(vault.memberUnits(alice), vault.memberUnits(bob));
        assertEq(vault.poolValue(), 100e6);
    }

    function testGovernedPurchaseUsesRealB20BalanceAndFeedValue() public {
        _deposit(alice, 50e6);
        _deposit(bob, 50e6);

        vm.prank(alice);
        uint256 proposalId = vault.createProposal(address(stock), address(router), 100e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId, true);
        vm.prank(bob);
        vault.vote(proposalId, true);

        router.setOutput(1e6);
        vm.prank(alice);
        vault.executeProposal(address(router), proposalId, 10);

        assertEq(stock.balanceOf(address(vault)), 1e6);
        assertEq(vault.poolValue(), 100e6);
        assertEq(vault.memberClaim(alice), 50e6);
    }

    function testMultiplierOnlyChangesAdjustedDisplayBalance() public {
        _buyStock();
        stock.setMultiplier(2e18);

        assertEq(vault.adjustedAssetBalance(), 2e6);
        assertEq(vault.poolValue(), 100e6);
    }

    function testVaultSwitchesStockAfterFirstPurchase() public {
        _deposit(alice, 50e6);
        _deposit(bob, 50e6);

        // First stock purchase.
        vm.prank(alice);
        uint256 proposalId = vault.createProposal(address(stock), address(router), 50e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId, true);
        vm.prank(bob);
        vault.vote(proposalId, true);
        router.setOutput(1e6);
        vm.prank(alice);
        vault.executeProposal(address(router), proposalId, 10);

        // Switching to a second stock is legal: the basket grows, nothing reverts.
        vm.prank(bob);
        uint256 proposalId2 = vault.createProposal(address(stock2), address(router2), 40e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId2, true);
        vm.prank(bob);
        vault.vote(proposalId2, true);
        router2.setOutput(2e6);
        vm.prank(alice);
        vault.executeProposal(address(router2), proposalId2, 10);

        assertEq(vault.heldAssets().length, 2);
        assertEq(stock.balanceOf(address(vault)), 1e6);
        assertEq(stock2.balanceOf(address(vault)), 2e6);
        // 10e6 USDC left + 1e6 * $100 + 2e6 * $100 = 10e6 + 100e6 + 200e6.
        assertEq(vault.poolValue(), 310e6);
        // Both assets price into the pro-rata claim.
        assertEq(vault.memberUnits(alice), vault.memberUnits(bob));
    }

    function testWithdrawalChecksB20ReceiverPolicy() public {
        _buyStock();
        stock.setPolicy(7);

        uint256 units = vault.memberUnits(alice);
        vm.prank(alice);
        vm.expectRevert(CirclaVault.UnauthorizedRecipient.selector);
        vault.withdraw(units, recipient);

        policies.setAuthorized(recipient, true);
        vm.prank(alice);
        vault.withdraw(units, recipient);
        assertEq(stock.balanceOf(recipient), 500_000);
    }

    function testUnauthorizedRecipientCanLiquidateB20ToUSDC() public {
        _buyStock();
        stock.setPolicy(7);
        router.setOutput(50e6);
        uint256 units = vault.memberUnits(alice);

        vm.prank(alice);
        vault.withdrawAsUSDC(units, recipient, address(router), 50e6);

        assertEq(usdc.balanceOf(recipient), 50e6);
        assertEq(stock.balanceOf(address(vault)), 500_000);
    }

    function testUninvitedWalletCannotJoin() public {
        vm.prank(mallory);
        vm.expectRevert(CirclaVault.NotInvited.selector);
        vault.join();
        assertFalse(vault.isMember(mallory));
    }

    function testOnlyOwnerCanInvite() public {
        address[] memory accounts = new address[](1);
        accounts[0] = mallory;
        vm.prank(alice);
        vm.expectRevert();
        vault.setInvites(accounts, true);

        vault.setInvites(accounts, true);
        vm.prank(mallory);
        vault.join();
        assertTrue(vault.isMember(mallory));
    }

    function testRevokedInviteBlocksJoin() public {
        address[] memory accounts = new address[](1);
        accounts[0] = mallory;
        vault.setInvites(accounts, true);
        vault.setInvites(accounts, false);
        vm.prank(mallory);
        vm.expectRevert(CirclaVault.NotInvited.selector);
        vault.join();
    }

    function testExecutionRevertsBelowFeedPriceFloor() public {
        _deposit(alice, 50e6);
        _deposit(bob, 50e6);
        // A zero slippage floor in the proposal no longer means "any price".
        uint256 proposalId = _passProposal(address(stock), address(router), 100e6, 0);
        // 0.94 stock at $100 = $94 for $100 spent: 6% below feed, over the 5% cap.
        router.setOutput(940_000);
        vm.prank(alice);
        vm.expectRevert(CirclaVault.ExecutionPriceTooLow.selector);
        vault.executeProposal(address(router), proposalId, 10);
        assertEq(usdc.balanceOf(address(vault)), 100e6);
    }

    function testExecutionAtFeedPriceFloorSucceeds() public {
        _deposit(alice, 50e6);
        _deposit(bob, 50e6);
        uint256 proposalId = _passProposal(address(stock), address(router), 100e6, 0);
        // Exactly 95% of feed value is the edge of the allowed band.
        router.setOutput(950_000);
        vm.prank(alice);
        vault.executeProposal(address(router), proposalId, 10);
        assertEq(stock.balanceOf(address(vault)), 950_000);
    }

    function testMixedPolicyRecipientCanStillWithdrawAsUSDC() public {
        _deposit(alice, 50e6);
        _deposit(bob, 50e6);
        uint256 p1 = _passProposal(address(stock), address(router), 50e6, 0);
        router.setOutput(500_000);
        vm.prank(alice);
        vault.executeProposal(address(router), p1, 10);
        uint256 p2 = _passProposal(address(stock2), address(router), 40e6, 0);
        router.setOutput(400_000);
        vm.prank(alice);
        vault.executeProposal(address(router), p2, 10);

        // Recipient clears the receiver policy for stock but not for stock2.
        stock.setPolicy(7);
        stock2.setPolicy(9);
        policies.setAuthorizedFor(7, recipient, true);
        uint256 units = vault.memberUnits(alice);

        vm.prank(alice);
        vm.expectRevert(CirclaVault.UnauthorizedRecipient.selector);
        vault.withdraw(units, recipient);

        // Half of each holding (250k + 200k) sold at 20 USDC per swap, plus half the 10 USDC float.
        router.setOutput(20e6);
        vm.prank(alice);
        uint256 out = vault.withdrawAsUSDC(units, recipient, address(router), 44e6);
        assertEq(out, 45e6);
        assertEq(usdc.balanceOf(recipient), 45e6);
        assertEq(vault.memberUnits(alice), 0);
    }

    function testAuthorizedRecipientMayChooseUSDC() public {
        _buyStock();
        stock.setPolicy(7);
        policies.setAuthorized(recipient, true);
        router.setOutput(50e6);
        uint256 units = vault.memberUnits(alice);

        vm.prank(alice);
        vault.withdrawAsUSDC(units, recipient, address(router), 50e6);
        assertEq(usdc.balanceOf(recipient), 50e6);
    }

    function testCannotExecuteWithoutQuorum() public {
        _deposit(alice, 100e6);
        vm.prank(alice);
        uint256 proposalId = vault.createProposal(address(stock), address(router), 50e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId, true);

        vm.prank(alice);
        vm.expectRevert(CirclaVault.QuorumNotReached.selector);
        vault.executeProposal(address(router), proposalId, 10);
    }

    function testCannotExecuteWithWrongTickSpacing() public {
        _deposit(alice, 50e6);
        _deposit(bob, 50e6);
        vm.prank(alice);
        uint256 proposalId = vault.createProposal(address(stock), address(router), 50e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId, true);
        vm.prank(bob);
        vault.vote(proposalId, true);

        vm.prank(alice);
        vm.expectRevert(CirclaVault.InvalidTickSpacing.selector);
        vault.executeProposal(address(router), proposalId, 50);
    }

    function testCannotExecuteWithUnapprovedRouter() public {
        _deposit(alice, 50e6);
        _deposit(bob, 50e6);
        vm.prank(alice);
        uint256 proposalId = vault.createProposal(address(stock), address(router), 50e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId, true);
        vm.prank(bob);
        vault.vote(proposalId, true);

        address rogue = address(0xBEEF);
        vm.prank(alice);
        vm.expectRevert(CirclaVault.InvalidProposal.selector);
        vault.executeProposal(rogue, proposalId, 10);
    }

    function testFridayClosePriceSurvivesWeekend() public {
        _buyStock();
        // Friday 2026-09-04 20:00 UTC: last print before the weekend freeze.
        vm.warp(1788552000);
        feed.setAnswer(100e8);
        // Sunday, 48h stale: valuation and deposits must keep working.
        vm.warp(1788552000 + 48 hours);
        assertEq(vault.poolValue(), 100e6);
        _deposit(alice, 10e6);
        assertEq(vault.poolValue(), 110e6);
    }

    function testNonFridayStalePriceStillReverts() public {
        _buyStock();
        // Wednesday print, 30h stale: not a weekend freeze, must fail closed.
        vm.warp(1788379200);
        feed.setAnswer(100e8);
        vm.warp(1788379200 + 30 hours);
        vm.expectRevert(CirclaVault.UnsafePrice.selector);
        vault.poolValue();
    }

    function testFridayPriceExpiresAfter72Hours() public {
        _buyStock();
        vm.warp(1788552000);
        feed.setAnswer(100e8);
        vm.warp(1788552000 + 73 hours);
        vm.expectRevert(CirclaVault.UnsafePrice.selector);
        vault.poolValue();
    }

    function _deposit(address member, uint256 amount) internal {
        vm.startPrank(member);
        usdc.approve(address(vault), amount);
        vault.deposit(amount);
        vm.stopPrank();
    }

    function _passProposal(address asset, address venue, uint256 amountIn, uint256 minAmountOut)
        internal
        returns (uint256 proposalId)
    {
        vm.prank(alice);
        proposalId = vault.createProposal(asset, venue, amountIn, minAmountOut);
        vm.prank(alice);
        vault.vote(proposalId, true);
        vm.prank(bob);
        vault.vote(proposalId, true);
    }

    function _buyStock() internal {
        _deposit(alice, 50e6);
        _deposit(bob, 50e6);
        vm.prank(alice);
        uint256 proposalId = vault.createProposal(address(stock), address(router), 100e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId, true);
        vm.prank(bob);
        vault.vote(proposalId, true);
        router.setOutput(1e6);
        vm.prank(alice);
        vault.executeProposal(address(router), proposalId, 10);
    }
}
