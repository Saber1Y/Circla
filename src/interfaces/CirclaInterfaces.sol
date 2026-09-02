// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC20Like {
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

interface IB20Like is IERC20Like {
    function scaledBalanceOf(address account) external view returns (uint256);
    function policyId(bytes32 policyScope) external view returns (uint64);
}

interface IPolicyRegistryLike {
    function isAuthorized(uint64 policyId, address account) external view returns (bool);
}

interface IPriceFeedLike {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

interface IAerodromeRouterLike {
    struct Route {
        address from;
        address to;
        bool stable;
        address factory;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        Route[] calldata routes,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}
