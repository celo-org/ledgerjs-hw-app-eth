import { DomainServiceResolution as DomainDescriptor } from "@ledgerhq/domain-service/types";
import { signAddressResolution, signDomainResolution } from "@ledgerhq/domain-service/signers/index";
export type LedgerEthTransactionResolution = {
    erc20Tokens: Array<string>;
    nfts: Array<string>;
    externalPlugin: Array<{
        payload: string;
        signature: string;
    }>;
    plugin: Array<string>;
    domains: DomainDescriptor[];
};
export type LoadConfig = {
    nftExplorerBaseURL?: string | null;
    pluginBaseURL?: string | null;
    extraPlugins?: any | null;
    cryptoassetsBaseURL?: string | null;
    calServiceURL?: string | null;
};
/**
 * Allows to configure precisely what the service need to resolve.
 * for instance you can set nft:true if you need clear signing on NFTs. If you set it and it is not a NFT transaction, it should still work but will do a useless service resolution.
 */
export type ResolutionConfig = {
    nft?: boolean;
    externalPlugins?: boolean;
    erc20?: boolean;
    domains?: DomainDescriptor[];
    uniswapV3?: boolean;
};
export type LedgerEthTransactionService = {
    resolveTransaction: (rawTxHex: string, loadConfig: LoadConfig, resolutionConfig: ResolutionConfig) => Promise<LedgerEthTransactionResolution>;
    signDomainResolution: typeof signDomainResolution;
    signAddressResolution: typeof signAddressResolution;
};
