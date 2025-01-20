/// <reference types="node" />
import fetch from 'node-fetch';
import WebSocket from 'ws';
import { Hash, Hmac } from 'crypto';
import * as dns from 'dns';
import { Buffer } from 'buffer';
import { Readable, Writable, Transform, PassThrough, Duplex } from 'stream';
export declare function getHashes(): string[];
export declare function createHash(alg: string): Hash;
export declare function createHmac(alg: string, key: string | Buffer): Hmac;
export declare function randomBytes(size: number): Buffer;
export declare type Resolver = dns.promises.Resolver;
export declare function createResolver(opts?: dns.ResolverOptions): Resolver | undefined;
declare const nativeRTCPeerConnection: RTCPeerConnection | undefined;
export declare const name = "node";
export { Buffer, fetch, Hash, Hmac, nativeRTCPeerConnection as RTCPeerConnection, WebSocket, Readable, Writable, Transform, Duplex, PassThrough };
