"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextTick = void 0;
/* eslint-disable @typescript-eslint/ban-types */
function nextTick(callback, ...args) {
    queueMicrotask(() => callback(...args));
}
exports.nextTick = nextTick;
