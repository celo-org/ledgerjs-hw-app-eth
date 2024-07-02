import BigNumber from "bignumber.js";
import { hexBuffer, intAsHexBytes } from "../../utils";
/**
 * @ignore for the README
 *
 * A Map of helpers to get the wanted binary value for
 * each type of array possible in a type definition
 */
var EIP712_ARRAY_TYPE_VALUE;
(function (EIP712_ARRAY_TYPE_VALUE) {
    EIP712_ARRAY_TYPE_VALUE[EIP712_ARRAY_TYPE_VALUE["DYNAMIC"] = 0] = "DYNAMIC";
    EIP712_ARRAY_TYPE_VALUE[EIP712_ARRAY_TYPE_VALUE["FIXED"] = 1] = "FIXED";
})(EIP712_ARRAY_TYPE_VALUE || (EIP712_ARRAY_TYPE_VALUE = {}));
/**
 * @ignore for the README
 *
 * A Map of helpers to get the id and size to return for each
 * type that can be used in EIP712
 */
export const EIP712_TYPE_PROPERTIES = {
    CUSTOM: {
        key: () => 0,
        sizeInBits: () => null,
    },
    INT: {
        key: () => 1,
        sizeInBits: size => Number(size) / 8,
    },
    UINT: {
        key: () => 2,
        sizeInBits: size => Number(size) / 8,
    },
    ADDRESS: {
        key: () => 3,
        sizeInBits: () => null,
    },
    BOOL: {
        key: () => 4,
        sizeInBits: () => null,
    },
    STRING: {
        key: () => 5,
        sizeInBits: () => null,
    },
    BYTES: {
        key: size => (typeof size !== "undefined" ? 6 : 7),
        sizeInBits: size => (typeof size !== "undefined" ? Number(size) : null),
    },
};
/**
 * @ignore for the README
 *
 * A Map of encoders to transform a value to formatted buffer
 */
export const EIP712_TYPE_ENCODERS = {
    INT(value, sizeInBits = 256) {
        const failSafeValue = value !== null && value !== void 0 ? value : "0";
        if (typeof failSafeValue === "string" && (failSafeValue === null || failSafeValue === void 0 ? void 0 : failSafeValue.startsWith("0x"))) {
            return hexBuffer(failSafeValue);
        }
        let valueAsBN = new BigNumber(failSafeValue);
        // If negative we'll use `two's complement` method to
        // "reversibly convert a positive binary number into a negative binary number with equivalent (but negative) value".
        // thx wikipedia
        if (valueAsBN.lt(0)) {
            const sizeInBytes = sizeInBits / 8;
            // Creates BN from a buffer serving as a mask filled by maximum value 0xff
            const maskAsBN = new BigNumber(`0x${Buffer.alloc(sizeInBytes, 0xff).toString("hex")}`);
            // two's complement version of value
            valueAsBN = maskAsBN.plus(valueAsBN).plus(1);
        }
        const paddedHexString = valueAsBN.toString(16).length % 2 ? "0" + valueAsBN.toString(16) : valueAsBN.toString(16);
        return Buffer.from(paddedHexString, "hex");
    },
    UINT(value) {
        return this.INT(value);
    },
    BOOL(value) {
        // @ts-expect-error
        return this.INT(typeof value === "boolean" ? Number(value).toString() : value);
    },
    ADDRESS(value) {
        // Only sending the first 10 bytes (why ?)
        return hexBuffer(value !== null && value !== void 0 ? value : "").slice(0, 20);
    },
    STRING(value) {
        return Buffer.from(value !== null && value !== void 0 ? value : "", "utf-8");
    },
    BYTES(value, sizeInBits) {
        const failSafeValue = value !== null && value !== void 0 ? value : "";
        // Why slice again ?
        return hexBuffer(failSafeValue).slice(0, sizeInBits !== null && sizeInBits !== void 0 ? sizeInBits : ((failSafeValue === null || failSafeValue === void 0 ? void 0 : failSafeValue.length) - 2) / 2);
    },
};
/**
 * @ignore for the README
 *
 * Helper parsing an EIP712 Type name to return its type and size(s)
 * if it's an array or nested arrays
 *
 * @see EIP712MessageTypes
 *
 * @example "uint8[2][][4]" => [{name: "uint", bits: 8}, [2, null, 4]]
 * @example "bool" => [{name: "bool", bits: null}, []]
 *
 * @param {String} typeName
 * @returns {[{ name: string; bits: Number | null }, Array<Number | null | undefined>]}
 */
export const destructTypeFromString = (typeName) => {
    // Will split "any[][1][10]" in "any", "[][1][10]"
    const splitNameAndArraysRegex = new RegExp(/^([^[\]]*)(\[.*\])*/g);
    // Will match all numbers (or null) inside each array. [0][10][] => [0,10,null]
    const splitArraysRegex = new RegExp(/\[(\d*)\]/g);
    // Will separate the the name from the potential bits allocation. uint8 => [uint,8]
    const splitNameAndNumberRegex = new RegExp(/(\D*)(\d*)/);
    const [, type, maybeArrays] = splitNameAndArraysRegex.exec(typeName || "") || [];
    const [, name, bits] = splitNameAndNumberRegex.exec(type || "") || [];
    const typeDescription = name ? { name, bits: bits ? Number(bits) : undefined } : null;
    const arrays = maybeArrays ? [...maybeArrays.matchAll(splitArraysRegex)] : [];
    // Parse each size to either a Number or null
    const arraySizes = arrays.map(([, size]) => (size ? Number(size) : null));
    return [typeDescription, arraySizes];
};
/**
 * @ignore for the README
 *
 * Helper to construct the hexadecimal ByteString for the description
 * of a field in an EIP712 Message
 *
 * @param isArray
 * @param typeSize
 * @param typeValue
 * @returns {String} HexByteString
 */
export const constructTypeDescByteString = (isArray, typeSize, typeValue) => {
    if (typeValue >= 16) {
        throw new Error("Eth utils - constructTypeDescByteString - Cannot accept a typeValue >= 16 because the typeValue can only be 4 bits in binary" +
            { isArray, typeSize, typeValue });
    }
    // 1 is array, 0 is not array
    const isArrayBit = isArray ? "1" : "0";
    // 1 has type size, 0 has no type size
    const hasTypeSize = typeof typeSize === "number" ? "1" : "0";
    // 2 unused bits
    const unusedBits = "00";
    // type key as 4 bits
    const typeValueBits = typeValue.toString(2).padStart(4, "0");
    return intAsHexBytes(parseInt(isArrayBit + hasTypeSize + unusedBits + typeValueBits, 2), 1);
};
/**
 * @ignore for the README
 *
 * Helper to create the buffer to describe an EIP712 types' entry structure
 *
 * @param {EIP712MessageTypesEntry} entry
 * @returns {Buffer}
 */
export const makeTypeEntryStructBuffer = ({ name, type }) => {
    var _a, _b, _c, _d;
    const [typeDescription, arrSizes] = destructTypeFromString(type);
    const isTypeAnArray = Boolean(arrSizes.length);
    const typeProperties = EIP712_TYPE_PROPERTIES[((_a = typeDescription === null || typeDescription === void 0 ? void 0 : typeDescription.name) === null || _a === void 0 ? void 0 : _a.toUpperCase()) || ""] ||
        EIP712_TYPE_PROPERTIES.CUSTOM;
    const typeKey = typeProperties.key(typeDescription === null || typeDescription === void 0 ? void 0 : typeDescription.bits);
    const typeSizeInBits = typeProperties.sizeInBits(typeDescription === null || typeDescription === void 0 ? void 0 : typeDescription.bits);
    const typeDescData = constructTypeDescByteString(isTypeAnArray, typeSizeInBits, typeKey);
    const bufferArray = [Buffer.from(typeDescData, "hex")];
    if (typeProperties === EIP712_TYPE_PROPERTIES.CUSTOM) {
        bufferArray.push(Buffer.from(intAsHexBytes((_c = (_b = typeDescription === null || typeDescription === void 0 ? void 0 : typeDescription.name) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0, 1), "hex"));
        bufferArray.push(Buffer.from((_d = typeDescription === null || typeDescription === void 0 ? void 0 : typeDescription.name) !== null && _d !== void 0 ? _d : "", "utf-8"));
    }
    if (typeof typeSizeInBits === "number") {
        bufferArray.push(Buffer.from(intAsHexBytes(typeSizeInBits, 1), "hex"));
    }
    if (isTypeAnArray) {
        bufferArray.push(Buffer.from(intAsHexBytes(arrSizes.length, 1), "hex"));
        arrSizes.forEach(size => {
            if (typeof size === "number") {
                bufferArray.push(Buffer.from(intAsHexBytes(EIP712_ARRAY_TYPE_VALUE.FIXED, 1), "hex"), Buffer.from(intAsHexBytes(size, 1), "hex"));
            }
            else {
                bufferArray.push(Buffer.from(intAsHexBytes(EIP712_ARRAY_TYPE_VALUE.DYNAMIC, 1), "hex"));
            }
        });
    }
    bufferArray.push(Buffer.from(intAsHexBytes(name.length, 1), "hex"), Buffer.from(name, "utf-8"));
    return Buffer.concat(bufferArray);
};
//# sourceMappingURL=utils.js.map