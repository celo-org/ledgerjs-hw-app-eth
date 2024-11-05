import { UniswapSupportedCommand } from "./types";
export declare const UniswapDecoders: Record<UniswapSupportedCommand, (input: `0x${string}`, chainId: number | string) => `0x${string}`[]>;
