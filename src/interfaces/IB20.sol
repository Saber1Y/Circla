// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @dev Interface for Base B20 Tokenized Stock precompiles.
 * B20 tokens are native precompiles (Beryl upgrade) — not standard ERC20 contracts.
 * eth_getCode returns 0xef at these addresses; they must be called via CALL opcode
 * with the exact function signatures below.
 */
interface IB20 {
    /**
     * @dev Returns the scaled balance of `account` in ray (60-decimal) format.
     * This is the primary query function for B20 precompiles.
     * @param account The address whose scaled balance is queried.
     * @return The scaled balance in ray format (1 ray = 10^6 units).
     */
    function scaledBalanceOf(address account) external view returns (int256);

    /**
     * @dev Returns the symbol of the token (e.g., "NVDAc").
     * Off-chain: typically the ticker + "c" suffix.
     * @return The token symbol string.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the name of the token (e.g., "NVIDIA Tokenized Stock").
     * @return The token name string.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the token decimals — always 8 for B20 precompiles.
     * @return The token decimals.
     */
    function decimals() external view returns (uint8);
}
