import { LoadConfig } from "../types";
export declare const findERC20SignaturesInfo: (userLoadConfig: LoadConfig, chainId: number) => Promise<string | null>;
/**
 * Retrieve the token information by a given contract address if any
 */
export declare const byContractAddressAndChainId: (contract: string, chainId: number, erc20SignaturesBlob?: string | null) => ReturnType<API["byContractAndChainId"]>;
export type TokenInfo = {
    contractAddress: string;
    ticker: string;
    decimals: number;
    chainId: number;
    signature: Buffer;
    data: Buffer;
};
export type API = {
    byContractAndChainId: (addr: string, id: number) => TokenInfo | null | undefined;
    list: () => TokenInfo[];
};
