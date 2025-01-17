import type { LoadConfig } from "../types";
type NftInfo = {
    contractAddress: string;
    collectionName: string;
    data: string;
};
export declare const getNFTInfo: (contractAddress: string, chainId: number, userLoadConfig: LoadConfig) => Promise<NftInfo | undefined>;
export declare const loadNftPlugin: (contractAddress: string, selector: string, chainId: number, userLoadConfig: LoadConfig) => Promise<string | undefined>;
export {};
