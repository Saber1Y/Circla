// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IB20Like, IPriceFeedLike} from "./interfaces/CirclaInterfaces.sol";

/// @title CirclaAssetRegistry
/// @notice Explicit allowlist for Coinbase B20 assets, their feeds, and approved routers.
contract CirclaAssetRegistry is Ownable {
    struct AssetConfig {
        address token;
        address priceFeed;
        uint8 tokenDecimals;
        int24 tickSpacing;
        uint256 maxTradeAmount;
        bool enabled;
    }

    mapping(address token => AssetConfig) public assets;
    mapping(address router => bool) public approvedRouters;

    event AssetConfigured(
        address indexed token,
        address indexed priceFeed,
        uint8 tokenDecimals,
        int24 tickSpacing,
        uint256 maxTradeAmount,
        bool enabled
    );
    event RouterConfigured(address indexed router, bool approved);

    error InvalidAddress();
    error InvalidPriceFeed();

    constructor(address owner_) Ownable(owner_) {}

    function configureAsset(
        address token,
        address priceFeed,
        uint8 tokenDecimals,
        int24 tickSpacing,
        uint256 maxTradeAmount,
        bool enabled
    ) external onlyOwner {
        if (token == address(0) || priceFeed == address(0)) revert InvalidAddress();
        if (tickSpacing <= 0) revert InvalidAddress();
        // B20 precompiles: skip decimals verification; use passed tokenDecimals.
        // (Calling decimals() on a precompile may revert; we rely on the
        //  tokenDecimals argument instead.)
        try IPriceFeedLike(priceFeed).decimals() returns (uint8) {}
        catch {
            revert InvalidPriceFeed();
        }
        assets[token] = AssetConfig({
            token: token,
            priceFeed: priceFeed,
            tokenDecimals: tokenDecimals,
            tickSpacing: tickSpacing,
            maxTradeAmount: maxTradeAmount,
            enabled: enabled
        });
        emit AssetConfigured(token, priceFeed, tokenDecimals, tickSpacing, maxTradeAmount, enabled);
    }

    function setRouter(address router, bool approved) external onlyOwner {
        if (router == address(0)) revert InvalidAddress();
        approvedRouters[router] = approved;
        emit RouterConfigured(router, approved);
    }

    function getAsset(address token) external view returns (AssetConfig memory) {
        return assets[token];
    }
}
