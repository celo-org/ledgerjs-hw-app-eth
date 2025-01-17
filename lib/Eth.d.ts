import { BigNumber } from "bignumber.js";
import type Transport from "@ledgerhq/hw-transport";
import { EIP712Message } from "@ledgerhq/types-live";
import { LedgerEthTransactionResolution, LoadConfig, ResolutionConfig } from "./services/types";
import ledgerService from "./services/ledger";
export { ledgerService };
export * from "./utils";
export type StarkQuantizationType = "eth" | "erc20" | "erc721" | "erc20mintable" | "erc721mintable";
/**
 * Ethereum API
 *
 * @example
 * import Eth from "@ledgerhq/hw-app-eth";
 * const eth = new Eth(transport)
 */
export default class Eth {
    transport: Transport;
    loadConfig: LoadConfig;
    setLoadConfig(loadConfig: LoadConfig): void;
    constructor(transport: Transport, scrambleKey?: string, loadConfig?: LoadConfig);
    /**
     * get Ethereum address for a given BIP 32 path.
     * @param path a path in BIP 32 format
     * @option boolDisplay optionally enable or not the display
     * @option boolChaincode optionally enable or not the chaincode request
     * @option chainId optionally display the network clearly on a Stax device
     * @return an object with a publicKey, address and (optionally) chainCode
     * @example
     * eth.getAddress("44'/60'/0'/0/0").then(o => o.address)
     */
    getAddress(path: string, boolDisplay?: boolean, boolChaincode?: boolean, chainId?: string): Promise<{
        publicKey: string;
        address: string;
        chainCode?: string;
    }>;
    /**
     * You can sign a transaction and retrieve v, r, s given the raw transaction and the BIP 32 path of the account to sign.
     *
     * @param path: the BIP32 path to sign the transaction on
     * @param rawTxHex: the raw ethereum transaction in hexadecimal to sign
     * @param resolution: resolution is an object with all "resolved" metadata necessary to allow the device to clear sign information. This includes: ERC20 token information, plugins, contracts, NFT signatures,... You must explicitly provide something to avoid having a warning. By default, you can use Ledger's service or your own resolution service. See services/types.js for the contract. Setting the value to "null" will fallback everything to blind signing but will still allow the device to sign the transaction.
     * @example
     import { ledgerService } from "@ledgerhq/hw-app-eth"
     const tx = "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080"; // raw tx to sign
     const resolution = await ledgerService.resolveTransaction(tx);
     const result = eth.signTransaction("44'/60'/0'/0/0", tx, resolution);
     console.log(result);
     */
    signTransaction(path: string, rawTxHex: string, resolution?: LedgerEthTransactionResolution | null): Promise<{
        s: string;
        v: string;
        r: string;
    }>;
    /**
     * Helper to get resolution and signature of a transaction in a single method
     *
     * @param path: the BIP32 path to sign the transaction on
     * @param rawTxHex: the raw ethereum transaction in hexadecimal to sign
     * @param resolutionConfig: configuration about what should be clear signed in the transaction
     * @param throwOnError: optional parameter to determine if a failing resolution of the transaction should throw an error or not
     * @example
     const tx = "e8018504e3b292008252089428ee52a8f3d6e5d15f8b131996950d7f296c7952872bd72a2487400080"; // raw tx to sign
     const result = eth.clearSignTransaction("44'/60'/0'/0/0", tx, { erc20: true, externalPlugins: true, nft: true});
     console.log(result);
     */
    clearSignTransaction(path: string, rawTxHex: string, resolutionConfig: ResolutionConfig, throwOnError?: boolean): Promise<{
        r: string;
        s: string;
        v: string;
    }>;
    /**
     */
    getAppConfiguration(): Promise<{
        arbitraryDataEnabled: number;
        erc20ProvisioningNecessary: number;
        starkEnabled: number;
        starkv2Supported: number;
        version: string;
    }>;
    /**
    * You can sign a message according to eth_sign RPC call and retrieve v, r, s given the message and the BIP 32 path of the account to sign.
    * @example
    eth.signPersonalMessage("44'/60'/0'/0/0", Buffer.from("test").toString("hex")).then(result => {
    var v = result['v'] - 27;
    v = v.toString(16);
    if (v.length < 2) {
      v = "0" + v;
    }
    console.log("Signature 0x" + result['r'] + result['s'] + v);
    })
     */
    signPersonalMessage(path: string, messageHex: string): Promise<{
        v: number;
        s: string;
        r: string;
    }>;
    /**
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
    signEIP712HashedMessage(path: string, domainSeparatorHex: string, hashStructMessageHex: string): Promise<{
        v: number;
        s: string;
        r: string;
    }>;
    /**
     * Sign an EIP-721 formatted message following the specification here:
     * https://github.com/LedgerHQ/app-ethereum/blob/develop/doc/ethapp.asc#sign-eth-eip-712
     * ⚠️ This method is not compatible with nano S (LNS). Make sure to use a try/catch to fallback on the signEIP712HashedMessage method ⚠️
     @example
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
     * @param {Object} jsonMessage message to sign
     * @param {Boolean} fullImplem use the legacy implementation
     * @returns {Promise}
     */
    signEIP712Message(path: string, jsonMessage: EIP712Message, fullImplem?: boolean): Promise<{
        v: number;
        s: string;
        r: string;
    }>;
    /**
     * Method returning a 4 bytes TLV challenge as an hexa string
     *
     * @returns {Promise<string>}
     */
    getChallenge(): Promise<string>;
    /**
     * get Stark public key for a given BIP 32 path.
     * @param path a path in BIP 32 format
     * @option boolDisplay optionally enable or not the display
     * @return the Stark public key
     */
    starkGetPublicKey(path: string, boolDisplay?: boolean): Promise<Buffer>;
    /**
     * sign a Stark order
     * @param path a path in BIP 32 format
     * @option sourceTokenAddress contract address of the source token (not present for ETH)
     * @param sourceQuantization quantization used for the source token
     * @option destinationTokenAddress contract address of the destination token (not present for ETH)
     * @param destinationQuantization quantization used for the destination token
     * @param sourceVault ID of the source vault
     * @param destinationVault ID of the destination vault
     * @param amountSell amount to sell
     * @param amountBuy amount to buy
     * @param nonce transaction nonce
     * @param timestamp transaction validity timestamp
     * @return the signature
     */
    starkSignOrder(path: string, sourceTokenAddress: string | undefined, sourceQuantization: BigNumber, destinationTokenAddress: string | undefined, destinationQuantization: BigNumber, sourceVault: number, destinationVault: number, amountSell: BigNumber, amountBuy: BigNumber, nonce: number, timestamp: number): Promise<Buffer | {
        r: string;
        s: string;
    }>;
    /**
     * sign a Stark order using the Starkex V2 protocol
     * @param path a path in BIP 32 format
     * @option sourceTokenAddress contract address of the source token (not present for ETH)
     * @param sourceQuantizationType quantization type used for the source token
     * @option sourceQuantization quantization used for the source token (not present for erc 721 or mintable erc 721)
     * @option sourceMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the source token
     * @option destinationTokenAddress contract address of the destination token (not present for ETH)
     * @param destinationQuantizationType quantization type used for the destination token
     * @option destinationQuantization quantization used for the destination token (not present for erc 721 or mintable erc 721)
     * @option destinationMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the destination token
     * @param sourceVault ID of the source vault
     * @param destinationVault ID of the destination vault
     * @param amountSell amount to sell
     * @param amountBuy amount to buy
     * @param nonce transaction nonce
     * @param timestamp transaction validity timestamp
     * @return the signature
     */
    starkSignOrder_v2(path: string, sourceTokenAddress: string | undefined, sourceQuantizationType: StarkQuantizationType, sourceQuantization: BigNumber | undefined, sourceMintableBlobOrTokenId: BigNumber | undefined, destinationTokenAddress: string | undefined, destinationQuantizationType: StarkQuantizationType, destinationQuantization: BigNumber | undefined, destinationMintableBlobOrTokenId: BigNumber | undefined, sourceVault: number, destinationVault: number, amountSell: BigNumber, amountBuy: BigNumber, nonce: number, timestamp: number): Promise<Buffer | {
        r: string;
        s: string;
    }>;
    /**
     * sign a Stark transfer
     * @param path a path in BIP 32 format
     * @option transferTokenAddress contract address of the token to be transferred (not present for ETH)
     * @param transferQuantization quantization used for the token to be transferred
     * @param targetPublicKey target Stark public key
     * @param sourceVault ID of the source vault
     * @param destinationVault ID of the destination vault
     * @param amountTransfer amount to transfer
     * @param nonce transaction nonce
     * @param timestamp transaction validity timestamp
     * @return the signature
     */
    starkSignTransfer(path: string, transferTokenAddress: string | undefined, transferQuantization: BigNumber, targetPublicKey: string, sourceVault: number, destinationVault: number, amountTransfer: BigNumber, nonce: number, timestamp: number): Promise<Buffer | {
        r: string;
        s: string;
    }>;
    /**
     * sign a Stark transfer or conditional transfer using the Starkex V2 protocol
     * @param path a path in BIP 32 format
     * @option transferTokenAddress contract address of the token to be transferred (not present for ETH)
     * @param transferQuantizationType quantization type used for the token to be transferred
     * @option transferQuantization quantization used for the token to be transferred (not present for erc 721 or mintable erc 721)
     * @option transferMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) associated to the token to be transferred
     * @param targetPublicKey target Stark public key
     * @param sourceVault ID of the source vault
     * @param destinationVault ID of the destination vault
     * @param amountTransfer amount to transfer
     * @param nonce transaction nonce
     * @param timestamp transaction validity timestamp
     * @option conditionalTransferAddress onchain address of the condition for a conditional transfer
     * @option conditionalTransferFact fact associated to the condition for a conditional transfer
     * @return the signature
     */
    starkSignTransfer_v2(path: string, transferTokenAddress: string | undefined, transferQuantizationType: StarkQuantizationType, transferQuantization: BigNumber | undefined, transferMintableBlobOrTokenId: BigNumber | undefined, targetPublicKey: string, sourceVault: number, destinationVault: number, amountTransfer: BigNumber, nonce: number, timestamp: number, conditionalTransferAddress?: string, conditionalTransferFact?: BigNumber): Promise<Buffer | {
        r: string;
        s: string;
    }>;
    /**
     * provide quantization information before singing a deposit or withdrawal Stark powered contract call
     *
     * It shall be run following a provideERC20TokenInformation call for the given contract
     *
     * @param operationContract contract address of the token to be transferred (not present for ETH)
     * @param operationQuantization quantization used for the token to be transferred
     */
    starkProvideQuantum(operationContract: string | undefined, operationQuantization: BigNumber): Promise<boolean>;
    /**
     * provide quantization information before singing a deposit or withdrawal Stark powered contract call using the Starkex V2 protocol
     *
     * It shall be run following a provideERC20TokenInformation call for the given contract
     *
     * @param operationContract contract address of the token to be transferred (not present for ETH)
     * @param operationQuantizationType quantization type of the token to be transferred
     * @option operationQuantization quantization used for the token to be transferred (not present for erc 721 or mintable erc 721)
     * @option operationMintableBlobOrTokenId mintable blob (mintable erc 20 / mintable erc 721) or token id (erc 721) of the token to be transferred
     */
    starkProvideQuantum_v2(operationContract: string | undefined, operationQuantizationType: StarkQuantizationType, operationQuantization?: BigNumber, operationMintableBlobOrTokenId?: BigNumber): Promise<boolean>;
    /**
     * sign the given hash over the Stark curve
     * It is intended for speed of execution in case an unknown Stark model is pushed and should be avoided as much as possible.
     * @param path a path in BIP 32 format
     * @param hash hexadecimal hash to sign
     * @return the signature
     */
    starkUnsafeSign(path: string, hash: string): Promise<Buffer | {
        r: string;
        s: string;
    }>;
    /**
     * get an Ethereum 2 BLS-12 381 public key for a given BIP 32 path.
     * @param path a path in BIP 32 format
     * @option boolDisplay optionally enable or not the display
     * @return an object with a publicKey
     * @example
     * eth.eth2GetPublicKey("12381/3600/0/0").then(o => o.publicKey)
     */
    eth2GetPublicKey(path: string, boolDisplay?: boolean): Promise<{
        publicKey: string;
    }>;
    /**
     * Set the index of a Withdrawal key used as withdrawal credentials in an ETH 2 deposit contract call signature
     *
     * It shall be run before the ETH 2 deposit transaction is signed. If not called, the index is set to 0
     *
     * @param withdrawalIndex index path in the EIP 2334 path m/12381/3600/withdrawalIndex/0
     * @return True if the method was executed successfully
     */
    eth2SetWithdrawalIndex(withdrawalIndex: number): Promise<boolean>;
    /**
     * get a public encryption key on Curve25519 according to EIP 1024
     * @param path a path in BIP 32 format
     * @option boolDisplay optionally enable or not the display
     * @return an object with a publicKey
     * @example
     * eth.getEIP1024PublicEncryptionKey("44'/60'/0'/0/0").then(o => o.publicKey)
     */
    getEIP1024PublicEncryptionKey(path: string, boolDisplay?: boolean): Promise<{
        publicKey: string;
    }>;
    /**
     * get a shared secret on Curve25519 according to EIP 1024
     * @param path a path in BIP 32 format
     * @param remotePublicKeyHex remote Curve25519 public key
     * @option boolDisplay optionally enable or not the display
     * @return an object with a shared secret
     * @example
     * eth.getEIP1024SharedSecret("44'/60'/0'/0/0", "87020e80af6e07a6e4697f091eacadb9e7e6629cb7e5a8a371689a3ed53b3d64").then(o => o.sharedSecret)
     */
    getEIP1024SharedSecret(path: string, remotePublicKeyHex: string, boolDisplay?: boolean): Promise<{
        sharedSecret: string;
    }>;
    /**
     * provides a trusted description of an ERC 20 token to associate a contract address with a ticker and number of decimals.
     *
     * @param data stringified buffer of ERC20 signature
     * @returns a boolean
     */
    provideERC20TokenInformation(data: string): Promise<boolean>;
    /**
     * provides the name of a trusted binding of a plugin with a contract address and a supported method selector. This plugin will be called to interpret contract data in the following transaction signing command.
     *
     * @param payload external plugin data
     * @option signature optionally signature for the plugin
     * @returns a boolean
     */
    setExternalPlugin(payload: string, signature?: string): Promise<boolean>;
    /**
     * provides the name of a trusted binding of a plugin with a contract address and a supported method selector. This plugin will be called to interpret contract data in the following transaction signing command.
     *
     * @param data stringified buffer of plugin signature
     * @returns a boolean
     */
    setPlugin(data: string): Promise<boolean>;
    /**
     *  provides a trusted description of an NFT to associate a contract address with a collectionName.
     *
     * @param data stringified buffer of the NFT description
     * @returns a boolean
     */
    provideNFTInformation(data: string): Promise<boolean>;
    /**
     * provides a domain name (like ENS) to be displayed during transactions in place of the address it is associated to. It shall be run just before a transaction involving the associated address that would be displayed on the device.
     *
     * @param data an stringied buffer of some TLV encoded data to represent the domain
     * @returns a boolean
     */
    provideDomainName(data: string): Promise<boolean>;
}
