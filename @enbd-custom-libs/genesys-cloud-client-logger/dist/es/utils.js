const DEEP_CLONE_MAX_DEPTH = 10;
export const calculateLogBufferSize = function (arr) {
    return arr.reduce((size, trace) => size + calculateLogMessageSize(trace), 0);
};
export const calculateLogMessageSize = function (trace) {
    const str = JSON.stringify(trace);
    // http://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
    // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
    const m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
};
export const getDeferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};
export const deepClone = function deepClone(itemToBeCloned, depth = DEEP_CLONE_MAX_DEPTH) {
    if (depth === 0) {
        return null;
    }
    /* eslint-disable guard-for-in */
    if (itemToBeCloned) {
        if (Array.isArray(itemToBeCloned)) {
            const clonedArray = [];
            for (let i = 0; i < itemToBeCloned.length; i++) {
                clonedArray[i] = deepClone(itemToBeCloned[i], depth - 1);
            }
            return clonedArray;
        }
        if (typeof itemToBeCloned === 'object') {
            const clonedObject = Object.assign({}, itemToBeCloned);
            for (const key in itemToBeCloned) {
                try {
                    clonedObject[key] = deepClone(itemToBeCloned[key], depth - 1);
                }
                catch (e) {
                    /* istanbul ignore next */
                    console.debug('WARN: Failed cloning key on object, ignoring', { key, object: itemToBeCloned });
                }
            }
            return clonedObject;
        }
    }
    return itemToBeCloned;
    /* eslint-enable guard-for-in */
};
