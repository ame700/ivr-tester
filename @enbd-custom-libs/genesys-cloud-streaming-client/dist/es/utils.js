import { __awaiter } from "tslib";
import { v4 } from 'uuid';
import { TimeoutError } from './types/timeout-error';
/* istanbul ignore next */
export function timeoutPromise(fn, timeoutMs, msg, details) {
    return new Promise(function (resolve, reject) {
        const timeout = setTimeout(function () {
            const err = new TimeoutError(`Timeout: ${msg}`);
            err.details = details;
            reject(err);
        }, timeoutMs);
        const done = function (resolvedValue) {
            clearTimeout(timeout);
            resolve(resolvedValue);
        };
        fn(done, reject);
    });
}
export function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
export function splitIntoIndividualTopics(topicString) {
    const topics = [];
    if (topicString.includes('?')) {
        const split = topicString.split('?');
        const prefix = split[0];
        const postfixes = split[1] && split[1].split('&');
        if (postfixes && postfixes.length) {
            postfixes.forEach(postfix => {
                topics.push(`${prefix}.${postfix}`);
            });
        }
    }
    else {
        topics.push(topicString);
    }
    return topics;
}
export const isAcdJid = function (jid) {
    return jid.startsWith('acd-') && !isSoftphoneJid(jid);
};
export const isScreenRecordingJid = function (jid) {
    return jid.startsWith('screenrecording-') && !isSoftphoneJid(jid);
};
export const isSoftphoneJid = function (jid) {
    if (!jid) {
        return false;
    }
    return !!jid.match(/.*@.*gjoll.*/i);
};
export const isVideoJid = function (jid) {
    return !!(jid && jid.match(/@conference/) && !isAcdJid(jid));
};
export function retryPromise(promiseFn, 
// if a number is returned, that's how long we will wait before retrying (in milliseconds)
retryFn, retryInterval = 15000, logger = console) {
    let timeout;
    let cancel;
    let complete;
    let tryPromiseFn;
    let _hasCompleted = false;
    const promise = new Promise((resolve, reject) => {
        tryPromiseFn = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const val = yield promiseFn();
                complete(val);
            }
            catch (error) {
                let timeToWait = retryInterval;
                const retryValue = retryFn(error);
                if (Number.isInteger(retryValue)) {
                    timeToWait = retryValue;
                }
                if (retryValue !== false) {
                    logger.debug('Retrying promise', error);
                    timeout = setTimeout(tryPromiseFn, timeToWait);
                }
                else {
                    cancel(error);
                }
            }
        });
        complete = (value) => {
            clearTimeout(timeout);
            _hasCompleted = true;
            resolve(value);
        };
        cancel = (reason) => {
            clearTimeout(timeout);
            _hasCompleted = true;
            reject(reason);
        };
        tryPromiseFn();
    });
    return {
        promise,
        cancel,
        complete,
        _id: v4(),
        hasCompleted: () => _hasCompleted
    };
}
// from https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript
export const parseJwt = (token) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
};
export function calculatePayloadSize(trace) {
    const str = JSON.stringify(trace);
    // http://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
    // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
    const m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
}
export function getUfragFromSdp(sdp) {
    if (!sdp) {
        return null;
    }
    const regex = /a=ice-ufrag:(\S+)/;
    const match = sdp.match(regex);
    return match ? match[1] : null;
}
export function getIcePwdFromSdp(sdp) {
    if (!sdp) {
        return null;
    }
    const regex = /a=ice-pwd:(\S+)/;
    const match = sdp.match(regex);
    return match ? match[1] : null;
}
export function iceIsDifferent(sdp1, sdp2) {
    return getUfragFromSdp(sdp1) !== getUfragFromSdp(sdp2) || getIcePwdFromSdp(sdp1) !== getIcePwdFromSdp(sdp2);
}
// unsed, but handy. no test coverage until used
// function mergeOptions (destination, provided) {
//   for (var key in provided) {
//     let value = provided[key];
//     if (value instanceof Object) {
//       if (!destination[key]) {
//         destination[key] = {};
//       }
//       mergeOptions(destination[key], value);
//     } else {
//       destination[key] = provided[key];
//     }
//   }
//
//   return destination;
// }
