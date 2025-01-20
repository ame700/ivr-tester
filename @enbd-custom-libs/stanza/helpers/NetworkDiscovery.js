"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const platform_1 = require("../platform");
const Utils_1 = require("../Utils");
const jxt_1 = require("../jxt");
const xrd_1 = (0, tslib_1.__importDefault)(require("../protocol/xrd"));
class NetworkDiscovery {
    constructor() {
        this.hostMetaCache = new Map();
        this.hostMetaTTL = 30000;
        this.resolver = (0, platform_1.createResolver)();
        this.registry = new jxt_1.Registry();
        this.registry.define(xrd_1.default);
    }
    async getHostMeta(domain) {
        const cached = this.hostMetaCache.get(domain);
        if (cached) {
            if (cached.created + this.hostMetaTTL < Date.now()) {
                return cached.hostmeta;
            }
            else {
                this.hostMetaCache.delete(domain);
            }
        }
        const hostmeta = (0, Utils_1.promiseAny)([
            (0, platform_1.fetch)(`https://${domain}/.well-known/host-meta.json`).then(async (res) => {
                if (!res.ok) {
                    throw new Error('could-not-fetch-json');
                }
                return res.json();
            }),
            (0, platform_1.fetch)(`https://${domain}/.well-known/host-meta`).then(async (res) => {
                if (!res.ok) {
                    throw new Error('could-not-fetch-xml');
                }
                const data = await res.text();
                const xml = (0, jxt_1.parse)(data);
                if (xml) {
                    return this.registry.import(xml);
                }
                else {
                    throw new Error('could-not-import-xml');
                }
            })
        ]);
        this.hostMetaCache.set(domain, { created: Date.now(), hostmeta });
        hostmeta.catch(() => {
            this.hostMetaCache.delete(domain);
        });
        return hostmeta;
    }
    async resolveTXT(domain) {
        var _a, _b;
        return (_b = (_a = this.resolver) === null || _a === void 0 ? void 0 : _a.resolveTxt(domain)) !== null && _b !== void 0 ? _b : [];
    }
    async resolve(domain, defaultPort, opts = {}) {
        if (!this.resolver) {
            return [];
        }
        let candidates = [];
        let allowFallback = true;
        if (opts.srvType) {
            const srvResults = await this.resolveWeightedSRV(domain, opts.srvType, opts.srvTypeSecure);
            allowFallback = srvResults.allowFallback;
            candidates = srvResults.records.map(record => ({
                host: record.name,
                port: record.port,
                secure: record.secure
            }));
        }
        if (allowFallback) {
            candidates.push({ host: domain, port: defaultPort });
        }
        return candidates;
    }
    async resolveWeightedSRV(domain, srvType, srvTypeSecure) {
        const [records, secureRecords] = await Promise.all([
            this.resolveSRV(domain, srvType),
            srvTypeSecure
                ? this.resolveSRV(domain, srvTypeSecure, true)
                : Promise.resolve({ records: [], allowFallback: false })
        ]);
        const allRecords = [...records.records, ...secureRecords.records];
        const priorities = new Map();
        let id = 0;
        for (const record of allRecords) {
            record.id = id++;
            record.runningSum = 0;
            if (!priorities.has(record.priority)) {
                priorities.set(record.priority, []);
            }
            const priorityGroup = priorities.get(record.priority);
            priorityGroup.push(record);
        }
        const weightRecords = (unweightedRecords) => {
            const sorted = [];
            while (sorted.length < unweightedRecords.length) {
                const ordered = (0, Utils_1.shuffle)(unweightedRecords.filter(record => record.weight === 0 && !record.used));
                const unordered = (0, Utils_1.shuffle)(unweightedRecords.filter(record => {
                    return record.weight !== 0 && !record.used;
                }));
                let weightSum = 0;
                for (const record of unordered) {
                    weightSum += record.weight;
                    record.runningSum = weightSum;
                    ordered.push(record);
                }
                const selector = Math.floor(Math.random() * (weightSum + 1));
                for (const record of ordered) {
                    if (record.runningSum >= selector) {
                        record.used = true;
                        sorted.push(record);
                        break;
                    }
                }
            }
            return sorted;
        };
        let sortedRecords = [];
        for (const priority of Array.from(priorities.keys()).sort((a, b) => a < b ? -1 : a > b ? 1 : 0)) {
            const priorityGroup = priorities.get(priority);
            sortedRecords = sortedRecords.concat(weightRecords(priorityGroup));
        }
        return {
            records: sortedRecords,
            allowFallback: records.allowFallback
        };
    }
    async resolveSRV(domain, srvType, secure) {
        var _a, _b;
        try {
            const records = (_b = (await ((_a = this.resolver) === null || _a === void 0 ? void 0 : _a.resolveSrv(`${srvType}.${domain}`)))) !== null && _b !== void 0 ? _b : [];
            if (records.length === 1 && (records[0].name === '.' || records[0].name === '')) {
                return { records: [], allowFallback: false };
            }
            return {
                records: records
                    .map(record => ({ secure, ...record }))
                    .filter(record => record.name !== '' && record.name !== '.'),
                allowFallback: false
            };
        }
        catch (_c) {
            return {
                records: [],
                allowFallback: true
            };
        }
    }
}
exports.default = NetworkDiscovery;
