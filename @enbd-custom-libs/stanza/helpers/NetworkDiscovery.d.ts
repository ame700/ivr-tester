import { XRD } from '../protocol/xrd';
export interface Candidate {
    host: string;
    port: number;
    secure?: boolean;
}
export interface DNSOptions {
    srvType?: string;
    srvTypeSecure?: string;
}
export interface SRVRecord {
    name: string;
    port: number;
    priority: number;
    weight: number;
    secure?: boolean;
    used?: boolean;
    runningSum?: number;
    id?: number;
}
export interface SRVResult {
    records: SRVRecord[];
    allowFallback: boolean;
}
export default class NetworkDiscovery {
    private resolver?;
    private registry;
    private hostMetaCache;
    private hostMetaTTL;
    constructor();
    getHostMeta(domain: string): Promise<XRD>;
    resolveTXT(domain: string): Promise<string[][]>;
    resolve(domain: string, defaultPort: number, opts?: DNSOptions): Promise<Candidate[]>;
    resolveWeightedSRV(domain: string, srvType: string, srvTypeSecure?: string): Promise<SRVResult>;
    resolveSRV(domain: string, srvType: string, secure?: boolean): Promise<SRVResult>;
}
