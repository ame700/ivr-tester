"use strict";
/**
 * This file is derived from prior work.
 *
 * See NOTICE.md for full license text.
 *
 * Derived from:
 * - hash-base, Copyright (c) 2016 Kirill Fomichev
 * - cipher-base, Copyright (c) 2017 crypto-browserify contributors
 * - create-hash, Copyright (c) 2017 crypto-browserify contributors
 */
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable no-bitwise
/* istanbul ignore file */
const buffer_1 = require("../buffer");
const stream_1 = require("../stream");
class Hash extends stream_1.Transform {
    constructor(blockSize, finalSize, endian = 'be') {
        super();
        this._block = buffer_1.Buffer.alloc(blockSize);
        this._finalSize = finalSize;
        this._blockSize = blockSize;
        this._bigEndian = endian === 'be';
        this._len = 0;
    }
    _transform(chunk, encoding, callback) {
        let error = null;
        try {
            this.update(chunk, encoding);
        }
        catch (err) {
            error = err;
        }
        callback(error);
    }
    _flush(callback) {
        let error = null;
        try {
            this.push(this.digest());
        }
        catch (err) {
            error = err;
        }
        callback(error);
    }
    update(data, enc) {
        if (typeof data === 'string') {
            enc = enc || 'utf8';
            data = buffer_1.Buffer.from(data, enc);
        }
        const block = this._block;
        const blockSize = this._blockSize;
        const length = data.length;
        let accum = this._len;
        for (let offset = 0; offset < length;) {
            const assigned = accum % blockSize;
            const remainder = Math.min(length - offset, blockSize - assigned);
            for (let i = 0; i < remainder; i++) {
                block[assigned + i] = data[offset + i];
            }
            accum += remainder;
            offset += remainder;
            if (accum % blockSize === 0) {
                this._update(block);
            }
        }
        this._len += length;
        return this;
    }
    digest(enc) {
        const rem = this._len % this._blockSize;
        this._block[rem] = 0x80;
        // zero (rem + 1) trailing bits, where (rem + 1) is the smallest
        // non-negative solution to the equation (length + 1 + (rem + 1)) === finalSize mod blockSize
        this._block.fill(0, rem + 1);
        if (rem >= this._finalSize) {
            this._update(this._block);
            this._block.fill(0);
        }
        const bits = this._len * 8;
        if (bits <= 0xffffffff) {
            if (this._bigEndian) {
                this._block.writeUInt32BE(0, this._blockSize - 8);
                this._block.writeUInt32BE(bits, this._blockSize - 4);
            }
            else {
                this._block.writeUInt32LE(bits, this._blockSize - 8);
                this._block.writeUInt32LE(0, this._blockSize - 4);
            }
        }
        else {
            const lowBits = (bits & 0xffffffff) >>> 0;
            const highBits = (bits - lowBits) / 0x100000000;
            if (this._bigEndian) {
                this._block.writeUInt32BE(highBits, this._blockSize - 8);
                this._block.writeUInt32BE(lowBits, this._blockSize - 4);
            }
            else {
                this._block.writeUInt32LE(lowBits, this._blockSize - 8);
                this._block.writeUInt32LE(highBits, this._blockSize - 4);
            }
        }
        this._update(this._block);
        const hash = this._hash();
        return enc ? hash.toString(enc) : hash;
    }
    _update(_block) {
        throw new Error('_update must be implemented by subclass');
    }
    _hash() {
        throw new Error('_update must be implemented by subclass');
    }
}
exports.default = Hash;
