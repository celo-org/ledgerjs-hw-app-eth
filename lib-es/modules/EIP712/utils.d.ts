import { EIP712MessageTypesEntry } from "@ledgerhq/types-live";
/**
 * @ignore for the README
 *
 * A Map of helpers to get the id and size to return for each
 * type that can be used in EIP712
 */
export declare const EIP712_TYPE_PROPERTIES: Record<string, {
    key: (size?: number) => number;
    sizeInBits: (size?: number) => number | null;
}>;
/**
 * @ignore for the README
 *
 * A Map of encoders to transform a value to formatted buffer
 */
export declare const EIP712_TYPE_ENCODERS: {
    INT(value: string | null, sizeInBits?: number): Buffer;
    UINT(value: string): Buffer;
    BOOL(value: number | string | boolean | null): Buffer;
    ADDRESS(value: string | null): Buffer;
    STRING(value: string | null): Buffer;
    BYTES(value: string | null, sizeInBits?: number): Buffer;
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
export declare const destructTypeFromString: (typeName?: string) => [{
    name: string;
    bits: number | undefined;
} | null, Array<number | null>];
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
export declare const constructTypeDescByteString: (isArray: boolean, typeSize: number | null | undefined, typeValue: number) => string;
/**
 * @ignore for the README
 *
 * Helper to create the buffer to describe an EIP712 types' entry structure
 *
 * @param {EIP712MessageTypesEntry} entry
 * @returns {Buffer}
 */
export declare const makeTypeEntryStructBuffer: ({ name, type }: EIP712MessageTypesEntry) => Buffer;
