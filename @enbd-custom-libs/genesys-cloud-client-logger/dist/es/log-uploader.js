var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
import { backOff } from 'exponential-backoff';
import { isAfter, add, differenceInMilliseconds } from 'date-fns';
import { getDeferred, deepClone } from './utils';
const SAVED_REQUESTS_KEY = 'gc_logger_requests';
const STATUS_CODES_TO_RETRY_IMMEDIATELY = [
    408,
    429,
    500,
    503,
    504
];
const STATUS_CODES_TO_RETRY_LATER = [
    401
];
const logUploaderMap = new Map();
export const getOrCreateLogUploader = (url, debugMode = false, useUniqueLogUploader, customHeaders) => {
    if (useUniqueLogUploader) {
        return new LogUploader(url, debugMode, customHeaders);
    }
    let uploader = logUploaderMap.get(url);
    /* if we don't have an uploader for this url, create one */
    if (!uploader) {
        uploader = new LogUploader(url, debugMode, customHeaders);
        logUploaderMap.set(url, uploader);
    }
    return uploader;
};
export class LogUploader {
    constructor(url, debugMode = false, customHeaders) {
        this.url = url;
        this.debugMode = debugMode;
        this.customHeaders = customHeaders;
        this.sendQueue = [];
    }
    postLogsToEndpoint(requestParams) {
        const deferred = getDeferred();
        this.sendQueue.push({ requestParams, deferred });
        this.sendNextQueuedLogToServer();
        this.debug('adding requestParams to sendQueue', {
            requestParams,
            updatedSendQueue: this.sendQueue.map(i => i.requestParams),
            hasPendingRequest: !!this.pendingRequest
        });
        return deferred.promise;
    }
    postLogsToEndpointInstantly(requestParams, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            this.debug('sending request instantly', { requestParams, sendQueue: this.sendQueue.map(i => i.requestParams) });
            if (!navigator.onLine) {
                return this.saveRequestForLater(requestParams);
            }
            try {
                yield this.sendPostRequest(requestParams);
            }
            catch (e) {
                if (opts === null || opts === void 0 ? void 0 : opts.saveOnFailure) {
                    this.saveRequestForLater(requestParams);
                }
                throw e;
            }
        });
    }
    saveRequestForLater(request) {
        const savedRequests = this.getSavedRequests() || [];
        const sanitizedRequest = Object.assign({}, request);
        delete sanitizedRequest.accessToken;
        savedRequests.push(sanitizedRequest);
        window.localStorage.setItem(SAVED_REQUESTS_KEY, JSON.stringify(savedRequests));
    }
    getSavedRequests() {
        const jsonStr = window.localStorage.getItem(SAVED_REQUESTS_KEY);
        if (jsonStr) {
            try {
                return JSON.parse(jsonStr);
            }
            catch (e) {
                console.error('Failed to parse saved messages, ignoring', { savedMessagesStr: jsonStr });
            }
        }
    }
    sendEntireQueue() {
        this.debug('sending all queued requests instantly to clear out sendQueue', {
            sendQueue: this.sendQueue.map(i => i.requestParams)
        });
        const promises = [];
        let queueItem;
        /* eslint-disable-next-line no-cond-assign */
        while (queueItem = this.sendQueue.shift()) {
            promises.push(this.postLogsToEndpointInstantly(queueItem.requestParams, { saveOnFailure: true }));
        }
        /* don't want this to be async because this is called from the window 'unload' event */
        return promises;
    }
    resetSendQueue() {
        this.debug('reseting send queue without sending currently queued data', { queueLength: this.sendQueue.length });
        this.sendQueue = [];
    }
    sendNextQueuedLogToServer() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pendingRequest || this.sendQueue.length === 0) {
                this.debug('sendNextQueuedLogToServer() but not sending request', {
                    hasPendingRequest: !!this.pendingRequest,
                    sendQueueLength: this.sendQueue.length
                });
                return;
            }
            /* don't remove the item from the queue until it is not longer being sent (this includes retries) */
            const queueItem = this.sendQueue.shift(); // `undefined` check happens above
            queueItem.deferred.promise.finally(() => {
                this.debug('queue item completed. removing from queue and resetting send queue', {
                    queueItemRequestParams: queueItem.requestParams, updatedSendQueue: this.sendQueue.map(i => i.requestParams)
                });
                /* reset state and send the next item in the queue */
                this.pendingRequest = undefined;
                this.sendNextQueuedLogToServer();
            });
            this.pendingRequest = queueItem;
            this.debug('sending logs to server', { queueItem: queueItem.requestParams, sendQueue: this.sendQueue.map(i => i.requestParams) });
            // return backOff(this.sendPostRequest.bind(this, queueItem.requestParams), {
            return backOff(() => this.backoffFn(queueItem.requestParams), {
                retry: (err) => {
                    var _a, _b, _c, _d, _e;
                    const status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
                    const code = err === null || err === void 0 ? void 0 : err.code;
                    // This *should* be an axios error according to typings, but it appears this could be an AxiosError *or* and XmlHttpRequest
                    // we'll check both to be safe
                    const newRetryAfter = ((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c['retry-after']) || ((_e = (_d = err.response) === null || _d === void 0 ? void 0 : _d.getResponseHeader) === null || _e === void 0 ? void 0 : _e.call(_d, 'retry-after'));
                    if (newRetryAfter) {
                        const newRetryAfterDate = add(new Date(), { seconds: parseInt(newRetryAfter, 10) });
                        if (!this.retryAfter || isAfter(newRetryAfterDate, this.retryAfter)) {
                            this.retryAfter = newRetryAfterDate;
                        }
                    }
                    // we get a "ERR_NETWORK" in the case of a network blip failure. if this happens, we will want to try again.
                    // this is akin to not getting a response at all
                    return navigator.onLine && ((status && STATUS_CODES_TO_RETRY_IMMEDIATELY.includes(status)) || code === "ERR_NETWORK");
                },
                numOfAttempts: 10,
                startingDelay: 0,
                delayFirstAttempt: false,
                maxDelay: 15000
            })
                .then((response) => {
                this.debug('successfully sent logs to server', { requestParams: queueItem.requestParams, response });
                queueItem.deferred.resolve(response);
            })
                .catch(this.handleBackoffError.bind(this, queueItem));
        });
    }
    handleBackoffError(queueItem, error) {
        var _a;
        // there are certain errors we know we don't want to try again, and certain errors/responses that *may* work in the future.
        const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
        const isRetriableStatus = status && STATUS_CODES_TO_RETRY_IMMEDIATELY.includes(status) || STATUS_CODES_TO_RETRY_LATER.includes(status);
        if (isRetriableStatus || error.code === "ERR_NETWORK") {
            this.debug('Failed to sends logs to the server, moving request to the end of the queue', { requestParams: queueItem.requestParams, error });
            this.saveRequestForLater(queueItem.requestParams);
        }
        else {
            this.debug('ERROR sending logs to server', { requestParams: queueItem.requestParams, error });
        }
        queueItem.deferred.reject(Object.assign(Object.assign({}, error), { id: "rejectionSpot1" }));
    }
    retryAfterTimerCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.retryAfter) {
                return;
            }
            // if we are past the designated retryAfter date, we are good
            if (isAfter(Date.now(), this.retryAfter)) {
                this.retryAfter = undefined;
                return;
                // else we need to wait *at least* until the new time and check again
            }
            else {
                const timeToWait = differenceInMilliseconds(this.retryAfter, Date.now());
                this.debug('Respecting "retry-after" response header, waiting to send request', { millisecondsToWait: timeToWait });
                yield new Promise(resolve => {
                    setTimeout(() => {
                        resolve(null);
                    }, timeToWait);
                });
                return this.retryAfterTimerCheck();
            }
        });
    }
    backoffFn(requestParams) {
        return __awaiter(this, void 0, void 0, function* () {
            // if we get a response with a Retry-After header, we want to wait for the time to elapse before we try again.
            yield this.retryAfterTimerCheck();
            const accessToken = requestParams.accessToken;
            const response = yield this.sendPostRequest(requestParams);
            // add any saved queue items to the queue using the access token
            const savedRequests = this.getSavedRequests();
            if (savedRequests) {
                window.localStorage.removeItem(SAVED_REQUESTS_KEY);
                savedRequests.map(request => {
                    const reqWithToken = Object.assign({ accessToken }, request);
                    // this adds it to the send queue, it doesn't send it immediately
                    this.postLogsToEndpoint(reqWithToken);
                });
            }
            return response;
        });
    }
    sendPostRequest(requestParams) {
        this.debug('issuing POST request', { requestParams });
        const requestBody = Object.assign({}, requestParams);
        delete requestBody.accessToken;
        const headers = Object.assign({ 'authorization': `Bearer ${requestParams.accessToken}`, 'content-type': 'application/json; charset=UTF-8' }, (this.customHeaders || {}));
        return axios({
            method: 'post',
            url: this.url,
            responseType: 'text',
            data: requestBody,
            headers,
        });
    }
    debug(message, details) {
        if (this.debugMode) {
            /* tslint:disable-next-line:no-console */
            console.log(`%c [DEBUG:log-uploader] ${message}`, 'color: #32a0a8', deepClone(details));
        }
    }
}
