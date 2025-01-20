"use strict";
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
exports.ServerLogger = void 0;
var safe_json_stringify_1 = __importDefault(require("safe-json-stringify"));
var utils_1 = require("./utils");
var log_uploader_1 = require("./log-uploader");
var MAX_LOG_SIZE = 14500;
var DEFAULT_UPLOAD_DEBOUNCE = 4000;
var ServerLogger = /** @class */ (function () {
    function ServerLogger(logger) {
        var _this = this;
        this.isInitialized = false;
        this.logBuffer = [];
        this.debounceTimer = null;
        this.logger = logger;
        /* if we have all the needed config options, set this up */
        if (!logger.config.url ||
            !logger.config.appVersion) {
            var errMessage = 'Missing `url` and/or `appVersion` config options to set up server logging. ' +
                'Not sending logs to server for this logger instance';
            this.logger.error(errMessage, { providedConfig: logger.config }, { skipServer: true });
            throw new Error(errMessage);
        }
        this.isInitialized = true;
        this.debounceLogUploadTime = logger.config.uploadDebounceTime || DEFAULT_UPLOAD_DEBOUNCE;
        this.logUploader = (0, log_uploader_1.getOrCreateLogUploader)(logger.config.url, logger.config.debugMode, logger.config.useUniqueLogUploader, logger.config.customHeaders);
        //window.addEventListener('unload', this.sendAllLogsInstantly.bind(this));
        /* when we stop server logging, we need to clear everything out */
        this.logger.on('onStop', function (_reason) {
            _this.debug('`onStop` received. Clearing logBuffer and sendQueue', {
                logBuffer: _this.logBuffer,
                sendQueue: _this.logUploader.sendQueue
            });
            _this.logBuffer = [];
            _this.logUploader.resetSendQueue();
        });
    }
    ServerLogger.prototype.addLogToSend = function (logLevel, message, details) {
        if (!this.isInitialized) {
            return;
        }
        var logMessage = this.convertToLogMessage(message, details);
        var trace = this.convertToTrace(logLevel, logMessage);
        var traceMessageSize = (0, utils_1.calculateLogMessageSize)(trace);
        /* if the individual message exceeds the max allowed size, truncate it */
        if (traceMessageSize > MAX_LOG_SIZE) {
            var newTrace = this.truncateLog(logLevel, logMessage);
            /* newTrace will be `null` if the truncated trace was still too big */
            if (newTrace === null) {
                this.logger.error('truncated message is too large to send to server. not sending message', {
                    originalTrace: trace,
                    originalTraceSize: (0, utils_1.calculateLogMessageSize)(trace),
                    truncatedTrace: newTrace,
                    truncatedTraceSize: (0, utils_1.calculateLogMessageSize)(newTrace)
                }, { skipServer: true });
                return;
            }
            /* set the trace to our new trunctated trace item */
            traceMessageSize = (0, utils_1.calculateLogMessageSize)(newTrace);
            trace = newTrace;
        }
        /* use the last item in the buffer if it exists, otherwise start with a blank buffer item */
        var useNewBufferItem = !this.logBuffer.length;
        var bufferItem;
        if (useNewBufferItem) {
            bufferItem = {
                size: 0,
                traces: []
            };
        }
        else {
            bufferItem = this.logBuffer[this.logBuffer.length - 1];
        }
        /* if pushing our trace onto the buffer item will be too large, we need a new buffer item */
        var exceedsMaxLogSize = bufferItem.size + traceMessageSize > MAX_LOG_SIZE;
        if (exceedsMaxLogSize) {
            this.debug('`exceedsMaxLogSize` was `true`', {
                logBuffer: this.logBuffer,
                bufferItem: bufferItem,
                incomingTrace: trace,
                incomingTraceSize: traceMessageSize,
                maxAllowedTraceSize: MAX_LOG_SIZE
            });
            this.logBuffer.push({
                size: traceMessageSize,
                traces: [trace]
            });
            /* since we pushed a new item, we need to send immediately */
            this.debug('calling sendLogsToServer(true)', { logBuffer: this.logBuffer });
            this.sendLogsToServer(true);
            return;
        }
        /* else just push onto the buffer */
        bufferItem.size += traceMessageSize;
        bufferItem.traces.push(trace);
        /* if we don't have anything in the buffer, that means we have to push this new item */
        if (useNewBufferItem) {
            this.debug('`this.logBuffer` was empty. pushing new buffer item', { logBuffer: this.logBuffer, bufferItem: bufferItem });
            this.logBuffer.push(bufferItem);
        }
        /* this will setup the debounce timer (if it is not already running) */
        this.debug('calling sendLogsToServer()', { logBuffer: this.logBuffer });
        this.sendLogsToServer();
    };
    ServerLogger.prototype.sendAllLogsInstantly = function () {
        var _this = this;
        /* don't want this to be async because this is called from the window 'unload' event */
        /* this will send any queued up requests */
        return this.logUploader.sendEntireQueue()
            .concat(
        /* this will send any items in the buffer still */
        this.logBuffer.map(function (item) {
            return _this.logUploader.postLogsToEndpointInstantly(_this.convertToRequestParams(item.traces.reverse()), { saveOnFailure: true });
        }));
    };
    ServerLogger.prototype.sendLogsToServer = function (immediate) {
        var _a;
        if (immediate === void 0) { immediate = false; }
        return __awaiter(this, void 0, void 0, function () {
            var bufferItem, err_1, statusCode;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.logBuffer.length) {
                            /* clear timer */
                            clearTimeout(this.debounceTimer);
                            this.debounceTimer = null;
                            this.debug('buffer empty, not sending http request');
                            return [2 /*return*/];
                        }
                        /* if we aren't sending immediately, then setup the timer */
                        if (!immediate) {
                            if (!this.debounceTimer) {
                                this.debug("sendLogsToServer() 'immediate' is false. setting up 'debounceTimer' to ".concat(this.debounceLogUploadTime, "ms"));
                                /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
                                this.debounceTimer = setTimeout(function () { return _this.sendLogsToServer(true); }, this.debounceLogUploadTime);
                            }
                            else {
                                this.debug("sendLogsToServer() 'immediate' is false. 'debounceTimer' is already running");
                            }
                            return [2 /*return*/];
                        }
                        /* clear timer */
                        clearTimeout(this.debounceTimer);
                        this.debounceTimer = null;
                        bufferItem = this.logBuffer.splice(0, 1)[0];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, 4, 5]);
                        // this.pendingHttpRequest = true;
                        this.debug('calling logUploader.postLogsToEndpoint() with', { bufferItem: bufferItem, newLogBuffer: this.logBuffer });
                        return [4 /*yield*/, this.logUploader.postLogsToEndpoint(this.convertToRequestParams(bufferItem.traces.reverse()))];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        err_1 = _b.sent();
                        this.logger.emit('onError', err_1);
                        this.logger.error('Error sending logs to server', err_1, { skipServer: true });
                        statusCode = (err_1 === null || err_1 === void 0 ? void 0 : err_1.status)
                            ? parseInt(err_1.status, 10)
                            : parseInt((_a = err_1 === null || err_1 === void 0 ? void 0 : err_1.response) === null || _a === void 0 ? void 0 : _a.status, 10);
                        if ([401, 403, 404].includes(statusCode)) {
                            this.logger.warn("received a ".concat(statusCode, " from logUploader. stopping logging to server"));
                            this.logger.stopServerLogging();
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        /* setup the debounce again */
                        this.sendLogsToServer();
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ServerLogger.prototype.truncateLog = function (logLevel, log) {
        var trace;
        var truncatedTraceSize;
        var originalTraceSize = (0, utils_1.calculateLogMessageSize)(this.convertToTrace(logLevel, log));
        var logCopy = (0, utils_1.deepClone)(log);
        var truncText = '[[TRUNCATED]]';
        if (!logCopy) {
            return null;
        }
        /* first truncate the details */
        logCopy.details = truncText;
        trace = this.convertToTrace(logLevel, logCopy);
        truncatedTraceSize = (0, utils_1.calculateLogMessageSize)(trace);
        if (truncatedTraceSize <= MAX_LOG_SIZE) {
            this.logger.warn('message too large to send to server. truncated log details', {
                originalLog: log,
                truncatedLog: logCopy,
                originalTraceSize: originalTraceSize,
                truncatedTraceSize: truncatedTraceSize,
                maxAllowedTraceSize: MAX_LOG_SIZE
            }, { skipServer: true });
            return trace;
        }
        /* second truncate the message */
        logCopy.message = "".concat(logCopy.message.substr(0, 150), "... ").concat(truncText);
        trace = this.convertToTrace(logLevel, logCopy);
        truncatedTraceSize = (0, utils_1.calculateLogMessageSize)(trace);
        if (truncatedTraceSize <= MAX_LOG_SIZE) {
            this.logger.warn('message too large to send to server. truncated log details & log message', {
                originalLog: log,
                truncatedLog: logCopy,
                originalTraceSize: originalTraceSize,
                truncatedTraceSize: truncatedTraceSize,
                maxAllowedTraceSize: MAX_LOG_SIZE
            }, { skipServer: true });
            return trace;
        }
        /* if the truncated trace is _still_ too large, return null because we aren't going to send this to the server */
        return null;
    };
    ServerLogger.prototype.convertToLogMessage = function (message, details) {
        var log = {
            clientTime: new Date().toISOString(),
            clientId: this.logger.clientId,
            message: message,
            details: details
        };
        var _a = this.logger.config, originAppName = _a.originAppName, originAppVersion = _a.originAppVersion, originAppId = _a.originAppId;
        /* only add these if they are configured */
        if (originAppName) {
            log.originAppName = originAppName;
            log.originAppVersion = originAppVersion;
            log.originAppId = originAppId;
        }
        return log;
    };
    ServerLogger.prototype.convertToTrace = function (level, log) {
        return {
            topic: this.logger.config.appName,
            level: level.toUpperCase(),
            message: (0, safe_json_stringify_1.default)(log)
        };
    };
    ServerLogger.prototype.convertToRequestParams = function (traces) {
        return {
            accessToken: this.logger.config.accessToken,
            app: {
                appId: this.logger.config.appName,
                appVersion: this.logger.config.appVersion
            },
            traces: traces
        };
    };
    ServerLogger.prototype.debug = function (message, details) {
        if (!this.logger.config.debugMode) {
            return;
        }
        /* tslint:disable-next-line:no-console */
        console.log("%c [DEBUG:".concat(this.logger.config.appName, "] ").concat(message), 'color: #32a852', (0, utils_1.deepClone)(details));
    };
    return ServerLogger;
}());
exports.ServerLogger = ServerLogger;
