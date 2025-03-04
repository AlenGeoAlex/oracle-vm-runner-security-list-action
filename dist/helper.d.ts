import { GetSecurityListResponse, IngressRule } from './models.js';
/**
 * Is OCI CLI installed
 */
export declare function isInstalled(): boolean;
/**
 * Install the OCI CLI
 */
export declare function installOciCli(): Promise<void>;
export declare function getSecurityList(options: {
    cliPath: string;
    securityGroupOcid: string;
    silent?: boolean;
}): Promise<GetSecurityListResponse>;
export declare function getIpAddress(): Promise<string | undefined>;
export declare function updateSecurityList(options: {
    cliPath: string;
    securityGroupOcid: string;
    ingressUpdate: IngressRule[];
    silent?: boolean;
}): Promise<void>;
