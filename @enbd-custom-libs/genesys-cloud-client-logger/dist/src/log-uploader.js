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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogUploader = exports.getOrCreateLogUploader = void 0;
var axios_1 = __importDefault(require("axios"));
var exponential_backoff_1 = require("exponential-backoff");
var date_fns_1 = require("date-fns");
var utils_1 = require("./utils");
var SAVED_REQUESTS_KEY = 'gc_logger_requests';
var STATUS_CODES_TO_RETRY_IMMEDIATELY = [
    408,
    429,
    500,
    503,
    504
];
var STATUS_CODES_TO_RETRY_LATER = [
    401
];
var logUploaderMap = new Map();
var getOrCreateLogUploader = function (url, debugMode, useUniqueLogUploader, customHeaders) {
    if (debugMode === void 0) { debugMode = false; }
    if (useUniqueLogUploader) {
        return new LogUploader(url, debugMode, customHeaders);
    }
    var uploader = logUploaderMap.get(url);
    /* if we don't have an uploader for this url, create one */
    if (!uploader) {
        uploader = new LogUploader(url, debugMode, customHeaders);
        logUploaderMap.set(url, uploader);
    }
    return uploader;
};
exports.getOrCreateLogUploader = getOrCreateLogUploader;
var LogUploader = /** @class */ (function () {
    function LogUploader(url, debugMode, customHeaders) {
        if (debugMode === void 0) { debugMode = false; }
        this.url = url;
        this.debugMode = debugMode;
        this.customHeaders = customHeaders;
        this.sendQueue = [];
    }
    LogUploader.prototype.postLogsToEndpoint = function (requestParams) {
        var deferred = (0, utils_1.getDeferred)();
        this.sendQueue.push({ requestParams: requestParams, deferred: deferred });
        this.sendNextQueuedLogToServer();
        this.debug('adding requestParams to sendQueue', {
            requestParams: requestParams,
            updatedSendQueue: this.sendQueue.map(function (i) { return i.requestParams; }),
            hasPendingRequest: !!this.pendingRequest
        });
        return deferred.promise;
    };
    LogUploader.prototype.postLogsToEndpointInstantly = function (requestParams, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.debug('sending request instantly', { requestParams: requestParams, sendQueue: this.sendQueue.map(function (i) { return i.requestParams; }) });
                        if (!navigator.onLine) {
                            return [2 /*return*/, this.saveRequestForLater(requestParams)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.sendPostRequest(requestParams)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        if (opts === null || opts === void 0 ? void 0 : opts.saveOnFailure) {
                            this.saveRequestForLater(requestParams);
                        }
                        throw e_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    LogUploader.prototype.saveRequestForLater = function (request) {
        var savedRequests = this.getSavedRequests() || [];
        var sanitizedRequest = __assign({}, request);
        delete sanitizedRequest.accessToken;
        savedRequests.push(sanitizedRequest);
       // window.localStorage.setItem(SAVED_REQUESTS_KEY, JSON.stringify(savedRequests));
    };
    LogUploader.prototype.getSavedRequests = function () {
        var jsonStr =null;
        if (jsonStr) {
            try {
                return JSON.parse(jsonStr);
            }
            catch (e) {
                console.error('Failed to parse saved messages, ignoring', { savedMessagesStr: jsonStr });
            }
        }
    };
    LogUploader.prototype.sendEntireQueue = function () {
        this.debug('sending all queued requests instantly to clear out sendQueue', {
            sendQueue: this.sendQueue.map(function (i) { return i.requestParams; })
        });
        var promises = [];
        var queueItem;
        /* eslint-disable-next-line no-cond-assign */
        while (queueItem = this.sendQueue.shift()) {
            promises.push(this.postLogsToEndpointInstantly(queueItem.requestParams, { saveOnFailure: true }));
        }
        /* don't want this to be async because this is called from the window 'unload' event */
        return promises;
    };
    LogUploader.prototype.resetSendQueue = function () {
        this.debug('reseting send queue without sending currently queued data', { queueLength: this.sendQueue.length });
        this.sendQueue = [];
    };
    LogUploader.prototype.sendNextQueuedLogToServer = function () {
        return __awaiter(this, void 0, void 0, function () {
            var queueItem;
            var _this = this;
            return __generator(this, function (_a) {
                if (this.pendingRequest || this.sendQueue.length === 0) {
                    this.debug('sendNextQueuedLogToServer() but not sending request', {
                        hasPendingRequest: !!this.pendingRequest,
                        sendQueueLength: this.sendQueue.length
                    });
                    return [2 /*return*/];
                }
                queueItem = this.sendQueue.shift();
                queueItem.deferred.promise.finally(function () {
                    _this.debug('queue item completed. removing from queue and resetting send queue', {
                        queueItemRequestParams: queueItem.requestParams, updatedSendQueue: _this.sendQueue.map(function (i) { return i.requestParams; })
                    });
                    /* reset state and send the next item in the queue */
                    _this.pendingRequest = undefined;
                    _this.sendNextQueuedLogToServer();
                });
                this.pendingRequest = queueItem;
                this.debug('sending logs to server', { queueItem: queueItem.requestParams, sendQueue: this.sendQueue.map(function (i) { return i.requestParams; }) });
                // return backOff(this.sendPostRequest.bind(this, queueItem.requestParams), {
                return [2 /*return*/, (0, exponential_backoff_1.backOff)(function () { return _this.backoffFn(queueItem.requestParams); }, {
                        retry: function (err) {
                            var _a, _b, _c, _d, _e;
                            var status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
                            var code = err === null || err === void 0 ? void 0 : err.code;
                            // This *should* be an axios error according to typings, but it appears this could be an AxiosError *or* and XmlHttpRequest
                            // we'll check both to be safe
                            var newRetryAfter = ((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.headers) === null || _c === void 0 ? void 0 : _c['retry-after']) || ((_e = (_d = err.response) === null || _d === void 0 ? void 0 : _d.getResponseHeader) === null || _e === void 0 ? void 0 : _e.call(_d, 'retry-after'));
                            if (newRetryAfter) {
                                var newRetryAfterDate = (0, date_fns_1.add)(new Date(), { seconds: parseInt(newRetryAfter, 10) });
                                if (!_this.retryAfter || (0, date_fns_1.isAfter)(newRetryAfterDate, _this.retryAfter)) {
                                    _this.retryAfter = newRetryAfterDate;
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
                        .then(function (response) {
                        _this.debug('successfully sent logs to server', { requestParams: queueItem.requestParams, response: response });
                        queueItem.deferred.resolve(response);
                    })
                        .catch(this.handleBackoffError.bind(this, queueItem))];
            });
        });
    };
    LogUploader.prototype.handleBackoffError = function (queueItem, error) {
        var _a;
        // there are certain errors we know we don't want to try again, and certain errors/responses that *may* work in the future.
        var status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
        var isRetriableStatus = status && STATUS_CODES_TO_RETRY_IMMEDIATELY.includes(status) || STATUS_CODES_TO_RETRY_LATER.includes(status);
        if (isRetriableStatus || error.code === "ERR_NETWORK") {
            this.debug('Failed to sends logs to the server, moving request to the end of the queue', { requestParams: queueItem.requestParams, error: error });
            this.saveRequestForLater(queueItem.requestParams);
        }
        else {
            this.debug('ERROR sending logs to server', { requestParams: queueItem.requestParams, error: error });
        }
        queueItem.deferred.reject(__assign(__assign({}, error), { id: "rejectionSpot1" }));
    };
    LogUploader.prototype.retryAfterTimerCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var timeToWait_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.retryAfter) {
                            return [2 /*return*/];
                        }
                        if (!(0, date_fns_1.isAfter)(Date.now(), this.retryAfter)) return [3 /*break*/, 1];
                        this.retryAfter = undefined;
                        return [2 /*return*/];
                    case 1:
                        timeToWait_1 = (0, date_fns_1.differenceInMilliseconds)(this.retryAfter, Date.now());
                        this.debug('Respecting "retry-after" response header, waiting to send request', { millisecondsToWait: timeToWait_1 });
                        return [4 /*yield*/, new Promise(function (resolve) {
                                setTimeout(function () {
                                    resolve(null);
                                }, timeToWait_1);
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.retryAfterTimerCheck()];
                }
            });
        });
    };
    LogUploader.prototype.backoffFn = function (requestParams) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, response, savedRequests;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // if we get a response with a Retry-After header, we want to wait for the time to elapse before we try again.
                    return [4 /*yield*/, this.retryAfterTimerCheck()];
                    case 1:
                        // if we get a response with a Retry-After header, we want to wait for the time to elapse before we try again.
                        _a.sent();
                        accessToken = requestParams.accessToken;
                        return [4 /*yield*/, this.sendPostRequest(requestParams)];
                    case 2:
                        response = _a.sent();
                        savedRequests = this.getSavedRequests();
                        if (savedRequests) {
                         //   window.localStorage.removeItem(SAVED_REQUESTS_KEY);
                            savedRequests.map(function (request) {
                                var reqWithToken = __assign({ accessToken: accessToken }, request);
                                // this adds it to the send queue, it doesn't send it immediately
                                _this.postLogsToEndpoint(reqWithToken);
                            });
                        }
                        return [2 /*return*/, response];
                }
            });
        });
    };
    LogUploader.prototype.sendPostRequest = function (requestParams) {
        this.debug('issuing POST request', { requestParams: requestParams });
        var requestBody = __assign({}, requestParams);
        delete requestBody.accessToken;
        var headers = __assign({ 'authorization': "Bearer ".concat(requestParams.accessToken), 'content-type': 'application/json; charset=UTF-8' }, (this.customHeaders || {}));
        return (0, axios_1.default)({
            method: 'post',
            url: this.url,
            responseType: 'text',
            data: requestBody,
            headers: headers,
        });
    };
    LogUploader.prototype.debug = function (message, details) {
        if (this.debugMode) {
            /* tslint:disable-next-line:no-console */
            console.log("%c [DEBUG:log-uploader] ".concat(message), 'color: #32a0a8', (0, utils_1.deepClone)(details));
        }
    };
    return LogUploader;
}());
exports.LogUploader = LogUploader;
