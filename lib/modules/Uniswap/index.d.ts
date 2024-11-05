import type { Transaction } from "@ethersproject/transactions";
import { LoadConfig } from "../../services/types";
import { CommandsAndTokens } from "./types";
/**
 * @ignore for external documentation
 *
 * Indicates if the given calldata is supported by the Uniswap plugin
 * applying some basic checks and testing some assumptions
 * specific to the Uniswap plugin internals
 *
 * @param {`0x${string}`} calldata
 * @param {string | undefined} to
 * @param {number} chainId
 * @param {CommandsAndTokens} commandsAndTokens
 * @returns {boolean}
 */
export declare const isSupported: (calldata: `0x${string}`, to: string | undefined, chainId: number, commandsAndTokens: CommandsAndTokens) => boolean;
/**
 * @ignore for external documentation
 *
 * Provides a list of commands and associated tokens for a given Uniswap calldata
 *
 * @param {`0x${string}`} calldata
 * @param {number} chainId
 * @returns {CommandsAndTokens}
 */
export declare const getCommandsAndTokensFromUniswapCalldata: (calldata: `0x${string}`, chainId: number) => CommandsAndTokens;
/**
 * @ignore for external documentation
 *
 * Returns the necessary APDUs to load the Uniswap plugin
 * and the token descriptors for a transaction
 *
 * @param {Transaction} transaction
 * @param {number} chainId
 * @param {LoadConfig} userConfig
 * @returns {Promise<{ pluginData?: Buffer; tokenDescriptors?: Buffer[] }>}
 */
export declare const loadInfosForUniswap: (transaction: Transaction, chainId: number, userConfig?: LoadConfig) => Promise<{
    pluginData?: Buffer;
    tokenDescriptors?: Buffer[];
}>;
