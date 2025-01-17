import type { LoadConfig } from "../types";
type ContractMethod = {
    payload: string;
    signature: string;
    plugin: string;
    erc20OfInterest: string[];
    abi: any;
};
/**
 * Retrieve the metadatas a given contract address and a method selector
 */
export declare const loadInfosForContractMethod: (contractAddress: string, selector: string, chainId: number, userLoadConfig: LoadConfig) => Promise<ContractMethod | undefined>;
export {};
