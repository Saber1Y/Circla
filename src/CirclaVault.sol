// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CirclaAssetRegistry} from "./CirclaAssetRegistry.sol";
import {IB20Like, IPolicyRegistryLike, IPriceFeedLike, ISlipstreamRouterLike} from "./interfaces/CirclaInterfaces.sol";

/// @title CirclaVault
/// @notice A one-circle MVP vault for governed USDC contributions and B20 stock purchases.
/// @dev Deploy one vault per circle for the first release. A factory can compose these vaults later.
contract CirclaVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TRANSFER_RECEIVER_POLICY = keccak256("TRANSFER_RECEIVER_POLICY");
    uint256 public constant UNIT_SCALE = 1e18;
    uint256 public constant MAX_PRICE_AGE = 26 hours;
    // Chainlink 24/5 equity feeds hold Friday's close over the weekend.
    // A price frozen at a Friday update is market data, not a broken feed.
    uint256 public constant WEEKEND_PRICE_AGE = 72 hours;

    IERC20 public immutable usdc;
    CirclaAssetRegistry public immutable registry;
    IPolicyRegistryLike public immutable policyRegistry;

    string public circleName;
    uint8 public immutable maxMembers;
    uint8 public immutable quorum;
    uint256 public immutable contributionTarget;
    uint256 public immutable perTradeLimit;
    uint256 public immutable proposalTTL;

    // The vault can hold any number of registry-enabled B20 assets. portfolioAsset
    // is kept as the primary (first purchased) for display compatibility; the
    // full basket lives in heldAssets. Switching stocks is legal after purchase.
    address public portfolioAsset;
    address public portfolioFeed;
    address[] private _heldAssets;
    mapping(address asset => address feed) public _heldAssetFeed;
    mapping(address asset => bool) public _isHeldAsset;
    uint256 public totalUnits;
    uint256 public proposalCount;
    bool public circleOpen = true;
    bool public settlementPaused;

    address[] private _members;
    mapping(address member => bool) public isMember;
    mapping(address member => uint256) public memberUnits;
    mapping(uint256 proposalId => Proposal) public proposals;
    mapping(uint256 proposalId => mapping(address member => bool)) public hasVoted;

    struct Proposal {
        address proposer;
        address asset;
        address router;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 deadline;
        uint256 nonce;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
        bool cancelled;
    }

    event MemberJoined(address indexed member);
    event ContributionReceived(address indexed member, uint256 amount, uint256 units);
    event CircleClosed();
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed asset,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    );
    event VoteCast(uint256 indexed proposalId, address indexed member, bool support);
    event ProposalExecuted(uint256 indexed proposalId, address indexed router, uint256 amountIn, uint256 amountOut);
    event Withdrawal(
        address indexed member, address indexed recipient, uint256 units, uint256 usdcAmount, uint256 assetAmount
    );
    event LiquidationWithdrawal(
        address indexed member,
        address indexed recipient,
        uint256 units,
        uint256 reservedUsdc,
        uint256 liquidatedUsdc,
        uint256 assetAmount,
        address router
    );
    event SettlementPauseChanged(bool paused);

    error CircleClosedError();
    error FullCircle();
    error AlreadyMember();
    error NotMember();
    error InvalidQuorum();
    error InvalidProposal();
    error ProposalExpired();
    error AlreadyVoted();
    error QuorumNotReached();
    error SettlementPaused();
    error UnauthorizedRecipient();
    error InsufficientClaim();
    error UnsafePrice();
    error InvalidTickSpacing();
    error InvalidRecipient();
    error RecipientIsAuthorized();

    modifier onlyMember() {
        if (!isMember[msg.sender]) revert NotMember();
        _;
    }

    constructor(
        address owner_,
        address usdc_,
        address registry_,
        address policyRegistry_,
        string memory circleName_,
        uint8 maxMembers_,
        uint8 quorum_,
        uint256 contributionTarget_,
        uint256 perTradeLimit_,
        uint256 proposalTtl_
    ) Ownable(owner_) {
        if (usdc_ == address(0) || registry_ == address(0) || policyRegistry_ == address(0)) revert InvalidRecipient();
        if (maxMembers_ == 0 || quorum_ == 0 || quorum_ > maxMembers_) revert InvalidQuorum();
        usdc = IERC20(usdc_);
        registry = CirclaAssetRegistry(registry_);
        policyRegistry = IPolicyRegistryLike(policyRegistry_);
        circleName = circleName_;
        maxMembers = maxMembers_;
        quorum = quorum_;
        contributionTarget = contributionTarget_;
        perTradeLimit = perTradeLimit_;
        proposalTTL = proposalTtl_;
    }

    function join() external nonReentrant {
        if (!circleOpen) revert CircleClosedError();
        if (isMember[msg.sender]) revert AlreadyMember();
        if (_members.length >= maxMembers) revert FullCircle();
        isMember[msg.sender] = true;
        _members.push(msg.sender);
        emit MemberJoined(msg.sender);
    }

    function closeCircle() external onlyOwner {
        circleOpen = false;
        emit CircleClosed();
    }

    function deposit(uint256 amount) external onlyMember nonReentrant {
        if (amount == 0) revert InvalidProposal();
        uint256 valueBefore = poolValue();
        uint256 units;
        if (totalUnits == 0 || valueBefore == 0) {
            units = amount * UNIT_SCALE / 1e6;
        } else {
            units = amount * totalUnits / valueBefore;
        }
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        memberUnits[msg.sender] += units;
        totalUnits += units;
        emit ContributionReceived(msg.sender, amount, units);
    }

    function createProposal(address asset, address router, uint256 amountIn, uint256 minAmountOut)
        external
        onlyMember
        returns (uint256 proposalId)
    {
        CirclaAssetRegistry.AssetConfig memory config = registry.getAsset(asset);
        if (
            !config.enabled || !registry.approvedRouters(router) || amountIn == 0 || amountIn > perTradeLimit
                || amountIn > config.maxTradeAmount
        ) {
            revert InvalidProposal();
        }
        proposalId = ++proposalCount;
        uint256 deadline = block.timestamp + proposalTTL;
        proposals[proposalId] = Proposal({
            proposer: msg.sender,
            asset: asset,
            router: router,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            deadline: deadline,
            nonce: proposalId,
            yesVotes: 0,
            noVotes: 0,
            executed: false,
            cancelled: false
        });
        emit ProposalCreated(proposalId, msg.sender, asset, amountIn, minAmountOut, deadline);
    }

    function vote(uint256 proposalId, bool support) external onlyMember {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.proposer == address(0) || proposal.executed || proposal.cancelled) revert InvalidProposal();
        if (block.timestamp > proposal.deadline) revert ProposalExpired();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();
        hasVoted[proposalId][msg.sender] = true;
        if (support) proposal.yesVotes++;
        else proposal.noVotes++;
        emit VoteCast(proposalId, msg.sender, support);
    }

    function executeProposal(address router, uint256 proposalId, int24 tickSpacing)
        external
        onlyMember
        nonReentrant
        returns (uint256 amountOut)
    {
        if (settlementPaused) revert SettlementPaused();
        Proposal storage proposal = proposals[proposalId];
        if (proposal.proposer == address(0) || proposal.executed || proposal.cancelled) revert InvalidProposal();
        if (block.timestamp > proposal.deadline) revert ProposalExpired();
        if (proposal.yesVotes < quorum || proposal.yesVotes <= proposal.noVotes) revert QuorumNotReached();
        if (router != proposal.router || !registry.approvedRouters(router)) revert InvalidProposal();
        if (tickSpacing != registry.getAsset(proposal.asset).tickSpacing) revert InvalidTickSpacing();
        proposal.executed = true;
        usdc.forceApprove(router, proposal.amountIn);
        amountOut = ISlipstreamRouterLike(router)
            .exactInputSingle(
                ISlipstreamRouterLike.ExactInputSingleParams({
                    tokenIn: address(usdc),
                    tokenOut: proposal.asset,
                    tickSpacing: tickSpacing,
                    recipient: address(this),
                    deadline: proposal.deadline,
                    amountIn: proposal.amountIn,
                    amountOutMinimum: proposal.minAmountOut,
                    sqrtPriceLimitX96: 0
                })
            );
        usdc.forceApprove(router, 0);
        _registerHeldAsset(proposal.asset);
        emit ProposalExecuted(proposalId, router, proposal.amountIn, amountOut);
    }

    /// @notice Add an asset to the portfolio basket, pricing it via the registry.
    function _registerHeldAsset(address asset) internal {
        if (_isHeldAsset[asset]) return;
        _isHeldAsset[asset] = true;
        _heldAssets.push(asset);
        _heldAssetFeed[asset] = registry.getAsset(asset).priceFeed;
        if (portfolioAsset == address(0)) {
            portfolioAsset = asset;
            portfolioFeed = _heldAssetFeed[asset];
        }
    }

    function heldAssets() external view returns (address[] memory) {
        return _heldAssets;
    }

    function setSettlementPaused(bool paused) external onlyOwner {
        settlementPaused = paused;
        emit SettlementPauseChanged(paused);
    }

    function poolValue() public view returns (uint256) {
        uint256 value = usdc.balanceOf(address(this));
        uint256 len = _heldAssets.length;
        for (uint256 i = 0; i < len; i++) {
            address asset = _heldAssets[i];
            value += _assetValue(asset, _heldAssetFeed[asset], IB20Like(asset).balanceOf(address(this)));
        }
        return value;
    }

    function memberClaim(address member) public view returns (uint256) {
        if (totalUnits == 0) return 0;
        return memberUnits[member] * poolValue() / totalUnits;
    }

    function adjustedAssetBalance() external view returns (uint256) {
        if (portfolioAsset == address(0)) return 0;
        uint256 total;
        uint256 len = _heldAssets.length;
        for (uint256 i = 0; i < len; i++) {
            total += IB20Like(_heldAssets[i]).scaledBalanceOf(address(this));
        }
        return total;
    }

    function withdraw(uint256 units, address recipient)
        external
        onlyMember
        nonReentrant
        returns (uint256 usdcAmount, uint256 assetAmount)
    {
        if (recipient == address(0)) revert InvalidRecipient();
        if (units == 0 || units > memberUnits[msg.sender]) revert InsufficientClaim();
        uint256 len = _heldAssets.length;
        for (uint256 i = 0; i < len; i++) {
            address asset = _heldAssets[i];
            uint64 policy = IB20Like(asset).policyId(TRANSFER_RECEIVER_POLICY);
            if (!policyRegistry.isAuthorized(policy, recipient)) revert UnauthorizedRecipient();
            uint256 share = IB20Like(asset).balanceOf(address(this)) * units / totalUnits;
            assetAmount += share;
            if (share > 0) IERC20(asset).safeTransfer(recipient, share);
        }
        usdcAmount = usdc.balanceOf(address(this)) * units / totalUnits;
        memberUnits[msg.sender] -= units;
        totalUnits -= units;
        if (usdcAmount > 0) usdc.safeTransfer(recipient, usdcAmount);
        emit Withdrawal(msg.sender, recipient, units, usdcAmount, assetAmount);
    }

    function withdrawAsUSDC(uint256 units, address recipient, address router, uint256 minAmountOut)
        external
        onlyMember
        nonReentrant
        returns (uint256 totalUsdc)
    {
        if (recipient == address(0)) revert InvalidRecipient();
        if (units == 0 || units > memberUnits[msg.sender]) revert InsufficientClaim();
        if (_heldAssets.length == 0) revert InvalidProposal();
        uint256 len = _heldAssets.length;
        for (uint256 i = 0; i < len; i++) {
            address asset = _heldAssets[i];
            uint64 policy = IB20Like(asset).policyId(TRANSFER_RECEIVER_POLICY);
            if (policyRegistry.isAuthorized(policy, recipient)) revert RecipientIsAuthorized();
        }
        if (!registry.approvedRouters(router)) revert InvalidProposal();

        uint256 originalTotal = totalUnits;
        uint256 reservedUsdc = usdc.balanceOf(address(this)) * units / originalTotal;
        memberUnits[msg.sender] -= units;
        totalUnits -= units;

        uint256 liquidatedUsdc;
        uint256 liquidatedAssets;
        for (uint256 i = 0; i < len; i++) {
            address asset = _heldAssets[i];
            uint256 share = IB20Like(asset).balanceOf(address(this)) * units / originalTotal;
            if (share == 0) continue;
            liquidatedAssets += share;
            IERC20(asset).forceApprove(router, share);
            liquidatedUsdc += ISlipstreamRouterLike(router)
                .exactInputSingle(
                    ISlipstreamRouterLike.ExactInputSingleParams({
                        tokenIn: asset,
                        tokenOut: address(usdc),
                        tickSpacing: registry.getAsset(asset).tickSpacing,
                        recipient: address(this),
                        deadline: block.timestamp,
                        amountIn: share,
                        amountOutMinimum: 0,
                        sqrtPriceLimitX96: 0
                    })
                );
            IERC20(asset).forceApprove(router, 0);
        }
        totalUsdc = reservedUsdc + liquidatedUsdc;
        if (totalUsdc < minAmountOut) revert InvalidProposal();
        usdc.safeTransfer(recipient, totalUsdc);
        emit LiquidationWithdrawal(msg.sender, recipient, units, reservedUsdc, liquidatedUsdc, liquidatedAssets, router);
    }

    function members() external view returns (address[] memory) {
        return _members;
    }

    /// @notice True when a feed timestamp must not be trusted for valuation.
    /// @dev Weekday rule is unchanged (26h). A feed frozen at a Friday update
    /// gets a 72h weekend grace; anything else stale fails closed.
    function _priceIsStale(uint256 updatedAt) internal view returns (bool) {
        uint256 age = block.timestamp - updatedAt;
        if (age <= MAX_PRICE_AGE) return false;
        if (age > WEEKEND_PRICE_AGE) return true;
        // 1970-01-01 was a Thursday: (days + 4) % 7 gives 0=Sunday..5=Friday.
        return (updatedAt / 1 days + 4) % 7 != 5;
    }

    function _assetValue(address token, address feed, uint256 rawBalance) internal view returns (uint256) {
        (, int256 answer,, uint256 updatedAt,) = IPriceFeedLike(feed).latestRoundData();
        if (answer <= 0 || updatedAt == 0 || _priceIsStale(updatedAt)) revert UnsafePrice();
        uint8 feedDecimals = IPriceFeedLike(feed).decimals();
        uint8 tokenDecimals = registry.getAsset(token).tokenDecimals;
        // The answer is positive by the check above, so this conversion cannot truncate a negative value.
        return rawBalance * uint256(answer) * 1e6 / (10 ** tokenDecimals) / (10 ** feedDecimals);
    }
}
