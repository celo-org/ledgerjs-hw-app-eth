import type { DomainServiceResolution as DomainDescriptor } from "@ledgerhq/domain-service/types";
import type Eth from "../../Eth";
/**
 * @ignore for the README
 *
 * This method will execute the pipeline of actions necessary for clear signing domains.
 * Signature is provided by the backend used in @ledgerhq/domain-service
 */
export declare const domainResolutionFlow: (appBinding: Eth, domainDescriptor: DomainDescriptor) => Promise<void>;
