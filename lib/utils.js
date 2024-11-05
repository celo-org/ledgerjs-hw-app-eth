"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeChunkTransaction = exports.getV = exports.getChainIdAsUint32 = exports.getParity = exports.mergeResolutions = exports.nftSelectors = exports.tokenSelectors = exports.intAsHexBytes = exports.padHexString = exports.ERC1155_CLEAR_SIGNED_SELECTORS = exports.ERC721_CLEAR_SIGNED_SELECTORS = exports.ERC20_CLEAR_SIGNED_SELECTORS = void 0;
exports.splitPath = splitPath;
exports.hexBuffer = hexBuffer;
exports.maybeHexBuffer = maybeHexBuffer;
const bignumber_js_1 = require("bignumber.js");
const rlp = __importStar(require("@ethersproject/rlp"));
const index_1 = require("@ledgerhq/evm-tools/selectors/index");
Object.defineProperty(exports, "ERC20_CLEAR_SIGNED_SELECTORS", { enumerable: true, get: function () { return index_1.ERC20_CLEAR_SIGNED_SELECTORS; } });
Object.defineProperty(exports, "ERC721_CLEAR_SIGNED_SELECTORS", { enumerable: true, get: function () { return index_1.ERC721_CLEAR_SIGNED_SELECTORS; } });
Object.defineProperty(exports, "ERC1155_CLEAR_SIGNED_SELECTORS", { enumerable: true, get: function () { return index_1.ERC1155_CLEAR_SIGNED_SELECTORS; } });
const padHexString = (str) => {
    return str.length % 2 ? "0" + str : str;
};
exports.padHexString = padHexString;
function splitPath(path) {
    const splittedPath = [];
    const paths = path.split("/");
    paths.forEach(path => {
        let value = parseInt(path, 10);
        if (isNaN(value)) {
            return; // FIXME shouldn't it throws instead?
        }
        // Detect hardened paths
        if (path.length > 1 && path[path.length - 1] === "'") {
            value += 0x80000000;
        }
        splittedPath.push(value);
    });
    return splittedPath;
}
function hexBuffer(str) {
    if (!str)
        return Buffer.alloc(0);
    const strWithoutPrefix = str.startsWith("0x") ? str.slice(2) : str;
    return Buffer.from((0, exports.padHexString)(strWithoutPrefix), "hex");
}
function maybeHexBuffer(str) {
    if (!str)
        return null;
    return hexBuffer(str);
}
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
const intAsHexBytes = (int, bytes) => int.toString(16).padStart(2 * bytes, "0");
exports.intAsHexBytes = intAsHexBytes;
exports.tokenSelectors = Object.values(index_1.ERC20_CLEAR_SIGNED_SELECTORS);
exports.nftSelectors = [
    ...Object.values(index_1.ERC721_CLEAR_SIGNED_SELECTORS),
    ...Object.values(index_1.ERC1155_CLEAR_SIGNED_SELECTORS),
];
const mergeResolutions = (resolutionsArray) => {
    const mergedResolutions = {
        nfts: [],
        erc20Tokens: [],
        externalPlugin: [],
        plugin: [],
        domains: [],
    };
    for (const resolutions of resolutionsArray) {
        for (const key in resolutions) {
            mergedResolutions[key].push(...resolutions[key]);
        }
    }
    return mergedResolutions;
};
exports.mergeResolutions = mergeResolutions;
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
const getParity = (vFromDevice, chainId, transactionType) => {
    if (transactionType)
        return vFromDevice;
    // The device use a 4 bytes integer to represent the chainId and keeps the highest bytes
    const chainIdUint32 = (0, exports.getChainIdAsUint32)(chainId);
    // Then applies EIP-155 to this chainId
    const chainIdWithEIP155 = chainIdUint32 * 2 + 35;
    // Since it's a single byte, we need to apply the overflow after reaching the max 0xff value and starting again to 0x00
    // for both possible values, the chainId with EIP155 and a 0 or 1 parity included
    const chainIdWithOverflowZero = chainIdWithEIP155 % 256;
    const chainIdWithOverflowOne = (chainIdWithEIP155 + 1) % 256;
    if (chainIdWithOverflowZero === vFromDevice) {
        return 0;
    }
    else if (chainIdWithOverflowOne === vFromDevice) {
        return 1;
    }
    throw new Error("Invalid v value");
};
exports.getParity = getParity;
/**
 * @ignore for the README
 *
 * Helper to convert a chainId from a BigNumber to a 4 bytes integer.
 * ChainIds are uint256, but the device limits them to 4 bytes
 *
 * @param {Number|BigNumber} chainId
 * @returns {Number}
 */
const getChainIdAsUint32 = (chainId) => {
    const chainIdBuff = Buffer.from((0, exports.padHexString)(new bignumber_js_1.BigNumber(chainId).toString(16)), "hex");
    const chainIdUint32 = chainIdBuff.subarray(0, 4);
    return parseInt(chainIdUint32.toString("hex"), 16);
};
exports.getChainIdAsUint32 = getChainIdAsUint32;
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
const getV = (vFromDevice, chainId, transactionType) => {
    if (chainId.isZero())
        return vFromDevice.toString(16);
    const parity = (0, exports.getParity)(vFromDevice, chainId, transactionType);
    return !transactionType
        ? // Legacy transactions (type 0) should apply EIP-155
            // EIP-155: rlp[(nonce, gasprice, startgas, to, value, data, chainid, 0, 0)]
            (0, exports.padHexString)(chainId.times(2).plus(35).plus(parity).toString(16))
        : // Transactions after type 1 should only use partity (00/01) as their v value
            // EIP-2930: 0x01 || rlp([chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, *signatureYParity*, signatureR, signatureS])
            // EIP-1559: 0x02 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, amount, data, access_list, *signature_y_parity*, signature_r, signature_s])
            // EIP-4844: 0x03 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, to, value, data, access_list, max_fee_per_blob_gas, blob_versioned_hashes, *y_parity*, r, s])
            // EIP-7702: 0x05 || rlp([chain_id, nonce, max_priority_fee_per_gas, max_fee_per_gas, gas_limit, destination, value, data, access_list, authorization_list, *signature_y_parity*, signature_r, signature_s])
            (0, exports.padHexString)(parity.toString(16));
};
exports.getV = getV;
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
const safeChunkTransaction = (transactionRlp, derivationPath, transactionType) => {
    const maxChunkSize = 255;
    // The full payload is the derivation path + the complete RLP of the transaction
    const payload = Buffer.concat([derivationPath, transactionRlp]);
    if (payload.length <= maxChunkSize)
        return [payload];
    if (transactionType) {
        const chunks = Math.ceil(payload.length / maxChunkSize);
        return new Array(chunks)
            .fill(null)
            .map((_, i) => payload.subarray(i * maxChunkSize, (i + 1) * maxChunkSize));
    }
    // Decode the RLP of the full transaction and keep only the last 3 elements (v, r, s)
    const decodedVrs = rlp.decode(transactionRlp).slice(-3);
    // Encode those values back to RLP in order to get the length of this serialized list
    // Result should be something like [0xc0 + list payload length, list.map(rlp)]
    // since only v can be used to store the chainId in legacy transactions
    const encodedVrs = rlp.encode(decodedVrs);
    // Since chainIds are uint256, the list payload length can be 1B (v rlp description) + 32B (v) + 1B (r) + 1B (s) = 35B max (< 55B)
    // Therefore, the RLP of this vrs list should be prefixed by a value between [0xc1, 0xe3] (0xc0 + 35B = 0xe3 max)
    // @see https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/
    // `encodedVrs` is then everything but the first byte of this serialization
    const encodedVrsBuff = hexBuffer(encodedVrs).subarray(1);
    // Since we want to avoid chunking just before the v,r,s values,
    // we just check the size of that payload and detect
    // if it would fit perfectly in 255B chunks
    // if it does, we chunk smaller parts
    let chunkSize = 0;
    const lastChunkSize = payload.length % maxChunkSize;
    if (lastChunkSize === 0 || lastChunkSize > encodedVrsBuff.length) {
        chunkSize = maxChunkSize;
    }
    else {
        for (let i = 1; i <= maxChunkSize; i++) {
            const lastChunkSize = payload.length % (maxChunkSize - i);
            if (lastChunkSize === 0 || lastChunkSize > encodedVrsBuff.length) {
                chunkSize = maxChunkSize - i;
                break;
            }
        }
    }
    const chunks = Math.ceil(payload.length / chunkSize);
    return new Array(chunks)
        .fill(null)
        .map((_, i) => payload.subarray(i * chunkSize, (i + 1) * chunkSize));
};
exports.safeChunkTransaction = safeChunkTransaction;
//# sourceMappingURL=utils.js.map