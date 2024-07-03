import { BigNumber } from "bignumber.js";
import { ERC20_CLEAR_SIGNED_SELECTORS, ERC721_CLEAR_SIGNED_SELECTORS, ERC1155_CLEAR_SIGNED_SELECTORS } from "@ledgerhq/evm-tools/selectors/index";
import { LedgerEthTransactionResolution } from "./services/types";
export { ERC20_CLEAR_SIGNED_SELECTORS, ERC721_CLEAR_SIGNED_SELECTORS, ERC1155_CLEAR_SIGNED_SELECTORS, };
export declare const padHexString: (str: string) => string;
export declare function splitPath(path: string): number[];
export declare function hexBuffer(str: string): Buffer;
export declare function maybeHexBuffer(str: string | null | undefined): Buffer | null | undefined;
export declare const decodeTxInfo: (rawTx: Buffer) => {
    decodedTx: any;
    txType: number | null;
    chainId: BigNumber;
    chainIdTruncated: number;
    vrsOffset: number;
};
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
