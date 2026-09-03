// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IAerodromeRouterLike} from "../interfaces/CirclaInterfaces.sol";

contract CirclaTestUSDC is ERC20 {
    constructor() ERC20("CIRCLA Test USDC", "tUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CirclaTestB20 is ERC20 {
    uint256 public multiplier = 1e18;
    uint64 public receiverPolicy;

    constructor() ERC20("CIRCLA Test NVIDIA", "tNVDAc") {}

    function decimals() public pure override returns (uint8) {
        return 8;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setMultiplier(uint256 value) external {
        multiplier = value;
    }

    function setReceiverPolicy(uint64 value) external {
        receiverPolicy = value;
    }

    function scaledBalanceOf(address account) external view returns (uint256) {
        return balanceOf(account) * multiplier / 1e18;
    }

    function policyId(bytes32) external view returns (uint64) {
        return receiverPolicy;
    }
}

contract CirclaTestPriceFeed {
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

contract CirclaTestPolicyRegistry {
    mapping(address => bool) public authorized;

    function setAuthorized(address account, bool value) external {
        authorized[account] = value;
    }

    function isAuthorized(uint64 policyId, address account) external view returns (bool) {
        return policyId == 0 || authorized[account];
    }
}

contract CirclaTestRouter {
    CirclaTestUSDC public immutable usdc;
    CirclaTestB20 public immutable stock;

    constructor(CirclaTestUSDC usdc_, CirclaTestB20 stock_) {
        usdc = usdc_;
        stock = stock_;
    }

    function getAmountsOut(uint256 amountIn, IAerodromeRouterLike.Route[] calldata routes)
        external
        view
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](routes.length + 1);
        amounts[0] = amountIn;
        for (uint256 i; i < routes.length; ++i) {
            amounts[i + 1] = routes[i].from == address(usdc) ? amounts[i] * 1e6 / 100e6 : amounts[i] * 100e6 / 1e6;
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        IAerodromeRouterLike.Route[] calldata routes,
        address to,
        uint256
    ) external returns (uint256[] memory amounts) {
        amounts = this.getAmountsOut(amountIn, routes);
        require(amounts[amounts.length - 1] >= amountOutMin, "minimum output");
        if (routes[0].from == address(usdc)) {
            require(usdc.transferFrom(msg.sender, address(this), amountIn), "USDC transfer failed");
            require(stock.transfer(to, amounts[amounts.length - 1]), "stock transfer failed");
        } else {
            require(stock.transferFrom(msg.sender, address(this), amountIn), "stock transfer failed");
            require(usdc.transfer(to, amounts[amounts.length - 1]), "USDC transfer failed");
        }
    }
}
