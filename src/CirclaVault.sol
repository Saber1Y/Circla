// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {CirclaAssetRegistry} from "./CirclaAssetRegistry.sol";
import {IB20Like, IPolicyRegistryLike, IPriceFeedLike, IAerodromeRouterLike} from "./interfaces/CirclaInterfaces.sol";

/// @title CirclaVault
/// @notice A one-circle MVP vault for governed USDC contributions and B20 stock purchases.
/// @dev Deploy one vault per circle for the first release. A factory can compose these vaults later.
contract CirclaVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TRANSFER_RECEIVER_POLICY = keccak256("TRANSFER_RECEIVER_POLICY");
    uint256 public constant UNIT_SCALE = 1e18;
    uint256 public constant MAX_PRICE_AGE = 26 hours;

    IERC20 public immutable usdc;
    CirclaAssetRegistry public immutable registry;
    IPolicyRegistryLike public immutable policyRegistry;

    string public circleName;
    uint8 public immutable maxMembers;
    uint8 public immutable quorum;
    uint256 public immutable contributionTarget;
    uint256 public immutable perTradeLimit;
    uint256 public immutable proposalTTL;

    address public portfolioAsset;
    address public portfolioFeed;
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
    error InvalidRoute();
    error InvalidRecipient();

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
        uint256 proposalTTL_
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
        proposalTTL = proposalTTL_;
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

    function createProposal(address asset, uint256 amountIn, uint256 minAmountOut)
        external
        onlyMember
        returns (uint256 proposalId)
    {
        CirclaAssetRegistry.AssetConfig memory config = registry.getAsset(asset);
        if (!config.enabled || amountIn == 0 || amountIn > perTradeLimit || amountIn > config.maxTradeAmount) {
            revert InvalidProposal();
        }
        proposalId = ++proposalCount;
        uint256 deadline = block.timestamp + proposalTTL;
        proposals[proposalId] =
            Proposal(msg.sender, asset, amountIn, minAmountOut, deadline, proposalId, 0, 0, false, false);
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

    function executeProposal(address router, uint256 proposalId, IAerodromeRouterLike.Route[] calldata routes)
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
        if (routes.length == 0 || routes[0].from != address(usdc) || routes[routes.length - 1].to != proposal.asset) {
            revert InvalidRoute();
        }
        for (uint256 i; i < routes.length; ++i) {
            if (i > 0 && routes[i - 1].to != routes[i].from) revert InvalidRoute();
        }
        if (!registry.approvedRouters(router)) revert InvalidProposal();
        proposal.executed = true;
        usdc.forceApprove(router, proposal.amountIn);
        uint256[] memory amounts = IAerodromeRouterLike(router)
            .swapExactTokensForTokens(
                proposal.amountIn, proposal.minAmountOut, routes, address(this), proposal.deadline
            );
        amountOut = amounts[amounts.length - 1];
        usdc.forceApprove(router, 0);
        if (portfolioAsset == address(0)) {
            portfolioAsset = proposal.asset;
            portfolioFeed = registry.getAsset(proposal.asset).priceFeed;
        } else if (portfolioAsset != proposal.asset) {
            revert InvalidProposal();
        }
        emit ProposalExecuted(proposalId, router, proposal.amountIn, amountOut);
    }

    function setSettlementPaused(bool paused) external onlyOwner {
        settlementPaused = paused;
        emit SettlementPauseChanged(paused);
    }

    function poolValue() public view returns (uint256) {
        uint256 value = usdc.balanceOf(address(this));
        if (portfolioAsset != address(0)) {
            value += _assetValue(portfolioAsset, portfolioFeed, IB20Like(portfolioAsset).balanceOf(address(this)));
        }
        return value;
    }

    function memberClaim(address member) public view returns (uint256) {
        if (totalUnits == 0) return 0;
        return memberUnits[member] * poolValue() / totalUnits;
    }

    function adjustedAssetBalance() external view returns (uint256) {
        if (portfolioAsset == address(0)) return 0;
        return IB20Like(portfolioAsset).scaledBalanceOf(address(this));
    }

    function withdraw(uint256 units, address recipient)
        external
        onlyMember
        nonReentrant
        returns (uint256 usdcAmount, uint256 assetAmount)
    {
        if (recipient == address(0)) revert InvalidRecipient();
        if (units == 0 || units > memberUnits[msg.sender]) revert InsufficientClaim();
        if (portfolioAsset != address(0)) {
            uint64 policy = IB20Like(portfolioAsset).policyId(TRANSFER_RECEIVER_POLICY);
            if (!policyRegistry.isAuthorized(policy, recipient)) revert UnauthorizedRecipient();
            assetAmount = IB20Like(portfolioAsset).balanceOf(address(this)) * units / totalUnits;
        }
        usdcAmount = usdc.balanceOf(address(this)) * units / totalUnits;
        memberUnits[msg.sender] -= units;
        totalUnits -= units;
        if (assetAmount > 0) IERC20(portfolioAsset).safeTransfer(recipient, assetAmount);
        if (usdcAmount > 0) usdc.safeTransfer(recipient, usdcAmount);
        emit Withdrawal(msg.sender, recipient, units, usdcAmount, assetAmount);
    }

    function members() external view returns (address[] memory) {
        return _members;
    }

    function _assetValue(address token, address feed, uint256 rawBalance) internal view returns (uint256) {
        (, int256 answer,, uint256 updatedAt,) = IPriceFeedLike(feed).latestRoundData();
        if (answer <= 0 || updatedAt == 0 || block.timestamp - updatedAt > MAX_PRICE_AGE) revert UnsafePrice();
        uint8 feedDecimals = IPriceFeedLike(feed).decimals();
        uint8 tokenDecimals = registry.getAsset(token).tokenDecimals;
        return rawBalance * uint256(answer) * 1e6 / (10 ** tokenDecimals) / (10 ** feedDecimals);
    }
}
