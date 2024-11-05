var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { parse as parseTransaction } from "@ethersproject/transactions";
import { Interface } from "@ethersproject/abi";
import { log } from "@ledgerhq/logs";
import { signDomainResolution, signAddressResolution, } from "@ledgerhq/domain-service/signers/index";
import { UNISWAP_UNIVERSAL_ROUTER_ADDRESS } from "../../modules/Uniswap/constants";
import { byContractAddressAndChainId, findERC20SignaturesInfo } from "./erc20";
import { loadInfosForUniswap } from "../../modules/Uniswap";
import { loadInfosForContractMethod } from "./contracts";
import { getNFTInfo, loadNftPlugin } from "./nfts";
import { tokenSelectors, nftSelectors, mergeResolutions, getChainIdAsUint32, } from "../../utils";
/**
 * @ignore for external documentation
 *
 * Providing additionnal data for some transactions (Token or NFT related) can enable clear signing
 * of initially impossible to decode data.
 * This method will add necessary APDUs to the resolution paramter in order to provide this data to the nano app
 */
const getAdditionalDataForContract = (contractAddress, chainIdUint32, loadConfig, shouldResolve) => __awaiter(void 0, void 0, void 0, function* () {
    const resolution = {
        nfts: [],
        erc20Tokens: [],
    };
    if (shouldResolve.nft) {
        const nftInfo = yield getNFTInfo(contractAddress, chainIdUint32, loadConfig);
        if (nftInfo) {
            log("ethereum", "loaded nft info for " + nftInfo.contractAddress + " (" + nftInfo.collectionName + ")");
            resolution.nfts.push(nftInfo.data);
        }
        else {
            log("ethereum", "couldn't load nft info for " + contractAddress);
        }
    }
    if (shouldResolve.token) {
        const erc20SignaturesBlob = yield findERC20SignaturesInfo(loadConfig, chainIdUint32);
        const erc20Info = byContractAddressAndChainId(contractAddress, chainIdUint32, erc20SignaturesBlob);
        if (erc20Info) {
            log("ethereum", "loaded erc20token info for " + erc20Info.contractAddress + " (" + erc20Info.ticker + ")");
            resolution.erc20Tokens.push(erc20Info.data.toString("hex"));
        }
        else {
            log("ethereum", "couldn't load erc20token info for " + contractAddress);
        }
    }
    return resolution;
});
/**
 * @ignore for external documentation
 *
 * Depending on the transaction, it might be necessary to load internal plugins in the nano app
 * in order to clear sign it.
 * This method will add necessary APDUs to the resolution parameter in order to load those internal plugins
 */
const loadNanoAppPlugins = (contractAddress, selector, parsedTransaction, chainIdUint32, loadConfig, shouldResolve) => __awaiter(void 0, void 0, void 0, function* () {
    let resolution = {
        externalPlugin: [],
        plugin: [],
        nfts: [],
        erc20Tokens: [],
        domains: [],
    };
    if (shouldResolve.nft) {
        const nftPluginPayload = yield loadNftPlugin(contractAddress, selector, chainIdUint32, loadConfig);
        if (nftPluginPayload) {
            resolution.plugin.push(nftPluginPayload);
        }
        else {
            log("ethereum", "no NFT plugin payload for selector " + selector + " and address " + contractAddress);
        }
    }
    // Uniswap has its own way of working, so we need to handle it separately
    // This will prevent an error if we add Uniswap to the CAL service
    if (shouldResolve.externalPlugins && contractAddress !== UNISWAP_UNIVERSAL_ROUTER_ADDRESS) {
        const contractMethodInfos = yield loadInfosForContractMethod(contractAddress, selector, chainIdUint32, loadConfig);
        if (contractMethodInfos) {
            const { plugin, payload, signature, erc20OfInterest, abi } = contractMethodInfos;
            if (plugin) {
                log("ethereum", `found plugin (${plugin}) for selector: ${selector}`);
                resolution.externalPlugin.push({ payload, signature });
            }
            if (erc20OfInterest && erc20OfInterest.length && abi) {
                const contract = new Interface(abi);
                const args = contract.parseTransaction(parsedTransaction).args;
                for (const path of erc20OfInterest) {
                    const erc20ContractAddress = path.split(".").reduce((value, seg) => {
                        if (seg === "-1" && Array.isArray(value)) {
                            return value[value.length - 1];
                        }
                        return value[seg];
                    }, args); // impossible(?) to type correctly as the initializer is different from the returned type
                    const externalPluginResolution = yield getAdditionalDataForContract(erc20ContractAddress, chainIdUint32, loadConfig, {
                        nft: false,
                        externalPlugins: false,
                        token: true, // enforcing resolution of tokens for external plugins that need info on assets (e.g. for a swap)
                        uniswapV3: false,
                    });
                    resolution = mergeResolutions([resolution, externalPluginResolution]);
                }
            }
        }
        else {
            log("ethereum", "no infos for selector " + selector);
        }
    }
    if (shouldResolve.uniswapV3) {
        const { pluginData, tokenDescriptors } = yield loadInfosForUniswap(parsedTransaction, chainIdUint32);
        if (pluginData && tokenDescriptors) {
            resolution.externalPlugin.push({
                payload: pluginData.toString("hex"),
                signature: "",
            });
            resolution.erc20Tokens.push(...tokenDescriptors.map(d => d.toString("hex")));
        }
    }
    return resolution;
});
/**
 * @ignore for external documentation
 *
 * In charge of collecting the different APDUs necessary for clear signing
 * a transaction based on a specified configuration.
 */
const resolveTransaction = (rawTxHex, loadConfig, resolutionConfig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const rawTx = Buffer.from(rawTxHex, "hex");
    const parsedTransaction = parseTransaction(`0x${rawTx.toString("hex")}`);
    const chainIdUint32 = getChainIdAsUint32(parsedTransaction.chainId);
    const { domains } = resolutionConfig;
    const contractAddress = (_a = parsedTransaction.to) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (!contractAddress)
        return {
            nfts: [],
            erc20Tokens: [],
            externalPlugin: [],
            plugin: [],
            domains: [],
        };
    const selector = parsedTransaction.data.length >= 10 && parsedTransaction.data.substring(0, 10);
    const resolutions = [];
    if (selector) {
        const shouldResolve = {
            token: resolutionConfig.erc20 && tokenSelectors.includes(selector),
            nft: resolutionConfig.nft &&
                nftSelectors.includes(selector),
            externalPlugins: resolutionConfig.externalPlugins,
            uniswapV3: resolutionConfig.uniswapV3,
        };
        const pluginsResolution = yield loadNanoAppPlugins(contractAddress, selector, parsedTransaction, chainIdUint32, loadConfig, shouldResolve);
        if (pluginsResolution) {
            resolutions.push(pluginsResolution);
        }
        const contractResolution = yield getAdditionalDataForContract(contractAddress, chainIdUint32, loadConfig, shouldResolve);
        if (contractResolution) {
            resolutions.push(contractResolution);
        }
    }
    // Passthrough to be accessible to the Domains module
    if (domains) {
        const domainResolutions = {
            domains,
        };
        resolutions.push(domainResolutions);
    }
    return mergeResolutions(resolutions);
});
export default {
    resolveTransaction,
    signDomainResolution,
    signAddressResolution,
};
//# sourceMappingURL=index.js.map