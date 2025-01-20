"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepClone = exports.getDeferred = exports.calculateLogMessageSize = exports.calculateLogBufferSize = void 0;
var DEEP_CLONE_MAX_DEPTH = 10;
var calculateLogBufferSize = function (arr) {
    return arr.reduce(function (size, trace) { return size + (0, exports.calculateLogMessageSize)(trace); }, 0);
};
exports.calculateLogBufferSize = calculateLogBufferSize;
var calculateLogMessageSize = function (trace) {
    var str = JSON.stringify(trace);
    // http://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
    // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
    var m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
};
exports.calculateLogMessageSize = calculateLogMessageSize;
var getDeferred = function () {
    var resolve;
    var reject;
    var promise = new Promise(function (res, rej) {
        resolve = res;
        reject = rej;
    });
    return { promise: promise, resolve: resolve, reject: reject };
};
exports.getDeferred = getDeferred;
var deepClone = function deepClone(itemToBeCloned, depth) {
    if (depth === void 0) { depth = DEEP_CLONE_MAX_DEPTH; }
    if (depth === 0) {
        return null;
    }
    /* eslint-disable guard-for-in */
    if (itemToBeCloned) {
        if (Array.isArray(itemToBeCloned)) {
            var clonedArray = [];
            for (var i = 0; i < itemToBeCloned.length; i++) {
                clonedArray[i] = deepClone(itemToBeCloned[i], depth - 1);
            }
            return clonedArray;
        }
        if (typeof itemToBeCloned === 'object') {
            var clonedObject = __assign({}, itemToBeCloned);
            for (var key in itemToBeCloned) {
                try {
                    clonedObject[key] = deepClone(itemToBeCloned[key], depth - 1);
                }
                catch (e) {
                    /* istanbul ignore next */
                    console.debug('WARN: Failed cloning key on object, ignoring', { key: key, object: itemToBeCloned });
                }
            }
            return clonedObject;
        }
    }
    return itemToBeCloned;
    /* eslint-enable guard-for-in */
};
exports.deepClone = deepClone;
