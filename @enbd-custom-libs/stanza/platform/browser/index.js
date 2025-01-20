"use strict";
/* istanbul ignore file */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassThrough = exports.Duplex = exports.Transform = exports.Writable = exports.Readable = exports.WebSocket = exports.RTCPeerConnection = exports.fetch = exports.Hmac = exports.Hash = exports.createHash = exports.Buffer = exports.name = exports.createResolver = exports.createHmac = exports.getHashes = exports.randomBytes = void 0;
const tslib_1 = require("tslib");
const buffer_1 = require("./buffer");
Object.defineProperty(exports, "Buffer", { enumerable: true, get: function () { return buffer_1.Buffer; } });
const createHash_1 = (0, tslib_1.__importStar)(require("./crypto/createHash"));
exports.createHash = createHash_1.default;
Object.defineProperty(exports, "Hash", { enumerable: true, get: function () { return createHash_1.Hash; } });
const Hmac_1 = (0, tslib_1.__importDefault)(require("./crypto/Hmac"));
exports.Hmac = Hmac_1.default;
const stream_1 = require("./stream");
Object.defineProperty(exports, "Readable", { enumerable: true, get: function () { return stream_1.Readable; } });
Object.defineProperty(exports, "Writable", { enumerable: true, get: function () { return stream_1.Writable; } });
Object.defineProperty(exports, "Transform", { enumerable: true, get: function () { return stream_1.Transform; } });
Object.defineProperty(exports, "PassThrough", { enumerable: true, get: function () { return stream_1.PassThrough; } });
Object.defineProperty(exports, "Duplex", { enumerable: true, get: function () { return stream_1.Duplex; } });
function randomBytes(size) {
    const rawBytes = new Uint8Array(size);
    if (size > 0) {
        (globalThis.crypto || globalThis.msCrypto).getRandomValues(rawBytes);
    }
    return buffer_1.Buffer.from(rawBytes.buffer);
}
exports.randomBytes = randomBytes;
function getHashes() {
    return ['sha-1', 'sha-256', 'sha-512', 'md5'];
}
exports.getHashes = getHashes;
function createHmac(alg, key) {
    return new Hmac_1.default(alg.toLowerCase(), key);
}
exports.createHmac = createHmac;
function createResolver() {
    return undefined;
}
exports.createResolver = createResolver;
const nativeFetch = globalThis.fetch.bind(globalThis);
exports.fetch = nativeFetch;
const nativeWS = globalThis.WebSocket;
exports.WebSocket = nativeWS;
const nativeRTCPeerConnection = globalThis
    .RTCPeerConnection;
exports.RTCPeerConnection = nativeRTCPeerConnection;
exports.name = 'browser';
