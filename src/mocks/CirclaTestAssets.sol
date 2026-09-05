// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ISlipstreamRouterLike} from "../interfaces/CirclaInterfaces.sol";

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
    uint256 public output;

    function setOutput(uint256 value) external {
        output = value;
    }

    function quote(uint256 amountIn, address tokenIn) external view returns (uint256) {
        if (output > 0) return output;
        return tokenIn == address(usdc) ? amountIn * 1e6 / 100e6 : amountIn * 100e6 / 1e6;
    }

    function exactInputSingle(ISlipstreamRouterLike.ExactInputSingleParams calldata params)
        external
        returns (uint256 amountOut)
    {
        amountOut = this.quote(params.amountIn, params.tokenIn);
        require(amountOut >= params.amountOutMinimum, "minimum output");
        if (params.tokenIn == address(usdc)) {
            require(usdc.transferFrom(msg.sender, address(this), params.amountIn), "USDC transfer failed");
            require(stock.transfer(params.recipient, amountOut), "stock transfer failed");
        } else {
            require(stock.transferFrom(msg.sender, address(this), params.amountIn), "stock transfer failed");
            require(usdc.transfer(params.recipient, amountOut), "USDC transfer failed");
        }
    }
}