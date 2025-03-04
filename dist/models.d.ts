export interface GetSecurityListResponse {
    data: Data;
    etag: string;
}
export interface Data {
    'compartment-id': string;
    'defined-tags': DefinedTags;
    'display-name': string;
    'egress-security-rules': EgressRule[];
    'freeform-tags': FreeformTags;
    id: string;
    'ingress-security-rules': IngressRule[];
    'lifecycle-state': string;
    'time-created': string;
    'vcn-id': string;
}
export interface DefinedTags {
    'Oracle-Tags': OracleTags;
}
export interface OracleTags {
    CreatedBy: string;
    CreatedOn: string;
}
export interface EgressRule {
    description?: string;
    destination: string;
    'destination-type': string;
    'icmp-options': any;
    'is-stateless': boolean;
    protocol: string;
    'tcp-options': any;
    'udp-options': any;
}
export interface FreeformTags {
}
export interface IngressRule {
    description: string;
    'icmp-options': any;
    'is-stateless': boolean;
    protocol: string;
    source: string;
    'source-type': string;
    'tcp-options'?: TcpOptions;
    'udp-options': any;
}
export interface TcpOptions {
    'destination-port-range': DestinationPortRange;
    'source-port-range': any;
}
export interface DestinationPortRange {
    max: number;
    min: number;
}
