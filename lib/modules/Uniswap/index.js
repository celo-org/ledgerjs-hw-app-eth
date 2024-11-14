"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadInfosForUniswap = exports.getCommandsAndTokensFromUniswapCalldata = exports.isSupported = void 0;
const logs_1 = require("@ledgerhq/logs");
const abi_1 = require("@ethersproject/abi");
const erc20_1 = require("../../services/ledger/erc20");
const decoders_1 = require("./decoders");
const constants_1 = require("./constants");
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
const isSupported = (calldata, to, chainId, commandsAndTokens) => {
    const selector = calldata.slice(0, 10);
    const contractAddress = to === null || to === void 0 ? void 0 : to.toLowerCase();
    if (selector !== constants_1.UNISWAP_EXECUTE_SELECTOR ||
        contractAddress !== constants_1.UNISWAP_UNIVERSAL_ROUTER_ADDRESS ||
        !commandsAndTokens.length) {
        return false;
    }
    let endingAsset;
    for (let i = 0; i < commandsAndTokens.length; i++) {
        const [command, tokens] = commandsAndTokens[i];
        if (!command)
            return false;
        if (!constants_1.SWAP_COMMANDS.includes(command))
            continue;
        const poolVersion = command.slice(0, 2);
        if (endingAsset &&
            // Chained swaps should work as a pipe regarding the traded assets:
            // The last asset of swap 1 should be the first asset of swap 2
            // and the same pool version should be used for both swaps
            (endingAsset.asset !== tokens[0] || endingAsset.poolVersion !== poolVersion)) {
            return false;
        }
        else {
            endingAsset = {
                poolVersion,
                asset: tokens[tokens.length - 1],
            };
        }
    }
    return true;
};
exports.isSupported = isSupported;
/**
 * @ignore for external documentation
 *
 * Provides a list of commands and associated tokens for a given Uniswap calldata
 *
 * @param {`0x${string}`} calldata
 * @param {number} chainId
 * @returns {CommandsAndTokens}
 */
const getCommandsAndTokensFromUniswapCalldata = (calldata, chainId) => {
    try {
        const [commands, inputs] = new abi_1.Interface([
            "function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) external payable",
        ]).decodeFunctionData("execute", calldata);
        const commandsBuffer = Buffer.from(commands.slice(2), "hex");
        return commandsBuffer.reduce((acc, curr, i) => {
            const commandName = constants_1.UNISWAP_COMMANDS[`0x${curr.toString(16).padStart(2, "0")}`];
            if (!commandName)
                return [...acc, [undefined, []]];
            const commandDecoder = decoders_1.UniswapDecoders[commandName];
            return [...acc, [commandName, commandDecoder(inputs[i], chainId)]];
        }, []);
    }
    catch (e) {
        (0, logs_1.log)("Uniswap", "Error decoding Uniswap calldata", e);
        return [];
    }
};
exports.getCommandsAndTokensFromUniswapCalldata = getCommandsAndTokensFromUniswapCalldata;
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
const loadInfosForUniswap = (transaction, chainId, userConfig) => __awaiter(void 0, void 0, void 0, function* () {
    const selector = transaction.data.slice(0, 10);
    const commandsAndTokens = (0, exports.getCommandsAndTokensFromUniswapCalldata)(transaction.data, chainId);
    if (!(0, exports.isSupported)(selector, transaction.to, chainId, commandsAndTokens)) {
        return {};
    }
    const tokenDescriptorsPromises = Promise.all(commandsAndTokens.flatMap(([, tokens]) => tokens.map((token) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const erc20SignaturesBlob = yield (0, erc20_1.findERC20SignaturesInfo)(userConfig || {}, chainId);
        return (_a = (0, erc20_1.byContractAddressAndChainId)(token, chainId, erc20SignaturesBlob)) === null || _a === void 0 ? void 0 : _a.data;
    }))));
    const tokenDescriptors = yield tokenDescriptorsPromises.then(descriptors => descriptors.filter((descriptor) => !!descriptor));
    const pluginName = "Uniswap";
    // 1 byte for the length of the plugin name
    const lengthBuff = Buffer.alloc(1);
    lengthBuff.writeUIntBE(pluginName.length, 0, 1);
    // dynamic length bytes for the plugin name
    const pluginNameBuff = Buffer.from(pluginName);
    // 20 bytes for the contract address
    const contractAddressBuff = Buffer.from(constants_1.UNISWAP_UNIVERSAL_ROUTER_ADDRESS.slice(2), "hex");
    // 4 bytes for the selector
    const selectorBuff = Buffer.from(constants_1.UNISWAP_EXECUTE_SELECTOR.slice(2), "hex");
    // 70 bytes for the signature
    const signature = Buffer.from(
    // Signature is hardcoded as it would create issues by being in the CAL ethereum.json file
    "3044022014391e8f355867a57fe88f6a5a4dbcb8bf8f888a9db3ff3449caf72d120396bd02200c13d9c3f79400fe0aa0434ac54d59b79503c9964a4abc3e8cd22763e0242935", "hex");
    const pluginData = Buffer.concat([
        lengthBuff,
        pluginNameBuff,
        contractAddressBuff,
        selectorBuff,
        signature,
    ]);
    return {
        pluginData,
        tokenDescriptors,
    };
});
exports.loadInfosForUniswap = loadInfosForUniswap;
//# sourceMappingURL=index.js.map