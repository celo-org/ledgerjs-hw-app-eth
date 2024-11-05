import { BigNumber } from "bignumber.js";
import { ERC20_CLEAR_SIGNED_SELECTORS, ERC721_CLEAR_SIGNED_SELECTORS, ERC1155_CLEAR_SIGNED_SELECTORS } from "@ledgerhq/evm-tools/selectors/index";
import type { Transaction } from "@ethersproject/transactions";
import { LedgerEthTransactionResolution } from "./services/types";
export { ERC20_CLEAR_SIGNED_SELECTORS, ERC721_CLEAR_SIGNED_SELECTORS, ERC1155_CLEAR_SIGNED_SELECTORS, };
export declare const padHexString: (str: string) => string;
export declare function splitPath(path: string): number[];
export declare function hexBuffer(str: string): Buffer;
export declare function maybeHexBuffer(str: string | null | undefined): Buffer | null | undefined;
/**
 * @ignore for the README
 *
 * Helper to convert an integer as a hexadecimal string with the right amount of digits
 * to respect the number of bytes given as parameter
 *
 * @param int Integer
 * @param bytes Number of bytes it should be represented as (1 byte = 2 caraters)
 * @returns The given integer as an hexa string padded with the right number of 0
 */
export declare const intAsHexBytes: (int: number, bytes: number) => string;
export declare const tokenSelectors: ERC20_CLEAR_SIGNED_SELECTORS[];
export declare const nftSelectors: (ERC721_CLEAR_SIGNED_SELECTORS | ERC1155_CLEAR_SIGNED_SELECTORS)[];
export declare const mergeResolutions: (resolutionsArray: Partial<LedgerEthTransactionResolution>[]) => LedgerEthTransactionResolution;
/**
 * @ignore for the README
 *
 * Ledger devices are returning v with potentially EIP-155 already applied when using legacy transactions.
 * Because that v value is only represented as a single byte, we need to replicate what would be the
 * overflow happening on the device while applying EIP-155 and recover the original parity.
 *
 * @param vFromDevice
 * @param chainIdUint32
 * @returns
 */
export declare const getParity: (vFromDevice: number, chainId: BigNumber, transactionType: Transaction["type"]) => 0 | 1;
/**
 * @ignore for the README
 *
 * Helper to convert a chainId from a BigNumber to a 4 bytes integer.
 * ChainIds are uint256, but the device limits them to 4 bytes
 *
 * @param {Number|BigNumber} chainId
 * @returns {Number}
 */
export declare const getChainIdAsUint32: (chainId: BigNumber | number) => number;
/**
 * @ignore for the README
 *
 * Depending on the transaction type you're trying to sign with the device, the v value will be different.
 * For legacy transactions, the v value is used to store the chainId, and that chainId can be a uint256,
 * and some math operation should be applied to it in order to comply with EIP-155 for replay attacks.
 *
 * In order to prevent breaking changes at the time, the `v` value has been kept as a single byte
 * which forces us to replicate an overflow happening on the device to get the correct `v` value
 *
 * @param {number} vFromDevice
 * @param {BigNumber} chainId
 * @param {Transaction["type"]} transactionType
 * @returns {string} hexa string of the v value
 */
export declare const getV: (vFromDevice: number, chainId: BigNumber, transactionType: Transaction["type"]) => string;
/**
 * @ignore for the README
 *
 * In order to prevent the device from considering a transaction RLP as complete before it actually is
 * we need to split the RLP into chunks which could not be mistaken for a complete transaction.
 * This is true for legacy transaction, where the `v` value is used to store the chainId
 *
 * @param {Buffer} transactionRlp
 * @param {Buffer }derivationPath
 * @param {Transaction["type"]} transactionType
 *
 * @returns {Buffer[]}
 */
export declare const safeChunkTransaction: (transactionRlp: Buffer, derivationPath: Buffer, transactionType: Transaction["type"]) => Buffer[];
