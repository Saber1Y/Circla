// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {CirclaAssetRegistry} from "../src/CirclaAssetRegistry.sol";
import {CirclaVault} from "../src/CirclaVault.sol";
import {IAerodromeRouterLike} from "../src/interfaces/CirclaInterfaces.sol";

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

    function setAuthorized(address account, bool value) external {
        authorized[account] = value;
    }

    function isAuthorized(uint64, address account) external view returns (bool) {
        return authorized[account];
    }
}

contract MockAerodromeRouter {
    using SafeTransferLib for address;
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

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        IAerodromeRouterLike.Route[] calldata,
        address to,
        uint256
    ) external returns (uint256[] memory amounts) {
        require(output >= amountOutMin, "minimum output");
        usdc.transferFrom(msg.sender, address(this), amountIn);
        stock.transfer(to, output);
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = output;
    }
}

library SafeTransferLib {
    function transferFrom(address token, address from, address to, uint256 amount) internal {
        require(MockUSDC(token).transferFrom(from, to, amount), "transferFrom failed");
    }
}

contract CirclaVaultTest is Test {
    MockUSDC usdc;
    MockB20 stock;
    MockFeed feed;
    MockPolicyRegistry policies;
    MockAerodromeRouter router;
    CirclaAssetRegistry registry;
    CirclaVault vault;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address recipient = address(0xCAFE);

    function setUp() public {
        usdc = new MockUSDC();
        stock = new MockB20();
        feed = new MockFeed();
        policies = new MockPolicyRegistry();
        router = new MockAerodromeRouter(usdc, stock);
        registry = new CirclaAssetRegistry(address(this));
        registry.configureAsset(address(stock), address(feed), 6, 1_000e6, true);
        registry.setRouter(address(router), true);
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
        uint256 proposalId = vault.createProposal(address(stock), 100e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId, true);
        vm.prank(bob);
        vault.vote(proposalId, true);

        router.setOutput(1e6);
        IAerodromeRouterLike.Route[] memory routes = new IAerodromeRouterLike.Route[](1);
        routes[0] = IAerodromeRouterLike.Route(address(usdc), address(stock), false, address(0));
        vm.prank(alice);
        vault.executeProposal(address(router), proposalId, routes);

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

    function testCannotExecuteWithoutQuorum() public {
        _deposit(alice, 100e6);
        vm.prank(alice);
        uint256 proposalId = vault.createProposal(address(stock), 50e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId, true);

        IAerodromeRouterLike.Route[] memory routes = new IAerodromeRouterLike.Route[](1);
        routes[0] = IAerodromeRouterLike.Route(address(usdc), address(stock), false, address(0));
        vm.prank(alice);
        vm.expectRevert(CirclaVault.QuorumNotReached.selector);
        vault.executeProposal(address(router), proposalId, routes);
    }

    function _deposit(address member, uint256 amount) internal {
        vm.startPrank(member);
        usdc.approve(address(vault), amount);
        vault.deposit(amount);
        vm.stopPrank();
    }

    function _buyStock() internal {
        _deposit(alice, 50e6);
        _deposit(bob, 50e6);
        vm.prank(alice);
        uint256 proposalId = vault.createProposal(address(stock), 100e6, 1e6);
        vm.prank(alice);
        vault.vote(proposalId, true);
        vm.prank(bob);
        vault.vote(proposalId, true);
        router.setOutput(1e6);
        IAerodromeRouterLike.Route[] memory routes = new IAerodromeRouterLike.Route[](1);
        routes[0] = IAerodromeRouterLike.Route(address(usdc), address(stock), false, address(0));
        vm.prank(alice);
        vault.executeProposal(address(router), proposalId, routes);
    }
}
