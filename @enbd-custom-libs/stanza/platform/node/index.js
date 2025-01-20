"use strict";
/* istanbul ignore file */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassThrough = exports.Duplex = exports.Transform = exports.Writable = exports.Readable = exports.WebSocket = exports.RTCPeerConnection = exports.Hmac = exports.Hash = exports.fetch = exports.Buffer = exports.name = exports.createResolver = exports.randomBytes = exports.createHmac = exports.createHash = exports.getHashes = void 0;
const tslib_1 = require("tslib");
const node_fetch_1 = (0, tslib_1.__importDefault)(require("node-fetch"));
exports.fetch = node_fetch_1.default;
const ws_1 = (0, tslib_1.__importDefault)(require("ws"));
exports.WebSocket = ws_1.default;
const crypto_1 = require("crypto");
Object.defineProperty(exports, "Hash", { enumerable: true, get: function () { return crypto_1.Hash; } });
Object.defineProperty(exports, "Hmac", { enumerable: true, get: function () { return crypto_1.Hmac; } });
const dns = (0, tslib_1.__importStar)(require("dns"));
const buffer_1 = require("buffer");
Object.defineProperty(exports, "Buffer", { enumerable: true, get: function () { return buffer_1.Buffer; } });
const stream_1 = require("stream");
const { RTCPeerConnection } = require("@roamhq/wrtc");
Object.defineProperty(exports, "Readable", { enumerable: true, get: function () { return stream_1.Readable; } });
Object.defineProperty(exports, "Writable", { enumerable: true, get: function () { return stream_1.Writable; } });
Object.defineProperty(exports, "Transform", { enumerable: true, get: function () { return stream_1.Transform; } });
Object.defineProperty(exports, "PassThrough", { enumerable: true, get: function () { return stream_1.PassThrough; } });
Object.defineProperty(exports, "Duplex", { enumerable: true, get: function () { return stream_1.Duplex; } });
const ianaNames = new Map([
    ['md2', 'md2'],
    ['md5', 'md5'],
    ['sha-1', 'sha1'],
    ['sha-224', 'sha224'],
    ['sha-256', 'sha256'],
    ['sha-384', 'sha384'],
    ['sha-512', 'sha512']
]);
function getHashes() {
    return ['sha-1', 'sha-256', 'sha-384', 'sha-512', 'md5'];
}
exports.getHashes = getHashes;
function createHash(alg) {
    return (0, crypto_1.createHash)(ianaNames.get(alg.toLowerCase()) || alg);
}
exports.createHash = createHash;
function createHmac(alg, key) {
    return (0, crypto_1.createHmac)(ianaNames.get(alg.toLowerCase()) || alg, key);
}
exports.createHmac = createHmac;
function randomBytes(size) {
    return (0, crypto_1.randomBytes)(size);
}
exports.randomBytes = randomBytes;
function createResolver(opts) {
    return new dns.promises.Resolver(opts);
}
exports.createResolver = createResolver;
const nativeRTCPeerConnection = RTCPeerConnection;
exports.RTCPeerConnection = nativeRTCPeerConnection;
exports.name = 'node';
