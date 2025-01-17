import type { EIP712Message } from "@ledgerhq/types-live";
import Transport from "@ledgerhq/hw-transport";
import { LoadConfig } from "../../services/types";
/**
 * @ignore for the README
 *
 * Sign an EIP-721 formatted message following the specification here:
 * https://github.com/LedgerHQ/app-ethereum/blob/develop/doc/ethapp.asc#sign-eth-eip-712
 * @example
  eth.signEIP721Message("44'/60'/0'/0/0", {
    domain: {
      chainId: 69,
      name: "Da Domain",
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      version: "1"
    },
    types: {
      "EIP712Domain": [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" }
        ],
      "Test": [
        { name: "contents", type: "string" }
      ]
    },
    primaryType: "Test",
    message: {contents: "Hello, Bob!"},
  })
 *
 * @param {String} path derivationPath
 * @param {Object} typedMessage message to sign
 * @param {Boolean} fullImplem use the legacy implementation
 * @returns {Promise}
 */
export declare const signEIP712Message: (transport: Transport, path: string, typedMessage: EIP712Message, fullImplem: boolean | undefined, loadConfig: LoadConfig) => Promise<{
    v: number;
    s: string;
    r: string;
}>;
/**
 * @ignore for the README
 * Sign a prepared message following web3.eth.signTypedData specification. The host computes the domain separator and hashStruct(message)
 * @example
 eth.signEIP712HashedMessage("44'/60'/0'/0/0", Buffer.from("0101010101010101010101010101010101010101010101010101010101010101").toString("hex"), Buffer.from("0202020202020202020202020202020202020202020202020202020202020202").toString("hex")).then(result => {
 var v = result['v'] - 27;
 v = v.toString(16);
 if (v.length < 2) {
   v = "0" + v;
 }
 console.log("Signature 0x" + result['r'] + result['s'] + v);
 })
 */
export declare const signEIP712HashedMessage: (transport: Transport, path: string, domainSeparatorHex: string, hashStructMessageHex: string) => Promise<{
    v: number;
    s: string;
    r: string;
}>;
