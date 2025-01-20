var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import stringify from 'safe-json-stringify';
import { calculateLogMessageSize, deepClone } from './utils';
import { getOrCreateLogUploader } from './log-uploader';
const MAX_LOG_SIZE = 14500;
const DEFAULT_UPLOAD_DEBOUNCE = 4000;
export class ServerLogger {
    constructor(logger) {
        this.isInitialized = false;
        this.logBuffer = [];
        this.debounceTimer = null;
        this.logger = logger;
        /* if we have all the needed config options, set this up */
        if (!logger.config.url ||
            !logger.config.appVersion) {
            const errMessage = 'Missing `url` and/or `appVersion` config options to set up server logging. ' +
                'Not sending logs to server for this logger instance';
            this.logger.error(errMessage, { providedConfig: logger.config }, { skipServer: true });
            throw new Error(errMessage);
        }
        this.isInitialized = true;
        this.debounceLogUploadTime = logger.config.uploadDebounceTime || DEFAULT_UPLOAD_DEBOUNCE;
        this.logUploader = getOrCreateLogUploader(logger.config.url, logger.config.debugMode, logger.config.useUniqueLogUploader, logger.config.customHeaders);
        window.addEventListener('unload', this.sendAllLogsInstantly.bind(this));
        /* when we stop server logging, we need to clear everything out */
        this.logger.on('onStop', (_reason) => {
            this.debug('`onStop` received. Clearing logBuffer and sendQueue', {
                logBuffer: this.logBuffer,
                sendQueue: this.logUploader.sendQueue
            });
            this.logBuffer = [];
            this.logUploader.resetSendQueue();
        });
    }
    addLogToSend(logLevel, message, details) {
        if (!this.isInitialized) {
            return;
        }
        const logMessage = this.convertToLogMessage(message, details);
        let trace = this.convertToTrace(logLevel, logMessage);
        let traceMessageSize = calculateLogMessageSize(trace);
        /* if the individual message exceeds the max allowed size, truncate it */
        if (traceMessageSize > MAX_LOG_SIZE) {
            const newTrace = this.truncateLog(logLevel, logMessage);
            /* newTrace will be `null` if the truncated trace was still too big */
            if (newTrace === null) {
                this.logger.error('truncated message is too large to send to server. not sending message', {
                    originalTrace: trace,
                    originalTraceSize: calculateLogMessageSize(trace),
                    truncatedTrace: newTrace,
                    truncatedTraceSize: calculateLogMessageSize(newTrace)
                }, { skipServer: true });
                return;
            }
            /* set the trace to our new trunctated trace item */
            traceMessageSize = calculateLogMessageSize(newTrace);
            trace = newTrace;
        }
        /* use the last item in the buffer if it exists, otherwise start with a blank buffer item */
        const useNewBufferItem = !this.logBuffer.length;
        let bufferItem;
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
        const exceedsMaxLogSize = bufferItem.size + traceMessageSize > MAX_LOG_SIZE;
        if (exceedsMaxLogSize) {
            this.debug('`exceedsMaxLogSize` was `true`', {
                logBuffer: this.logBuffer,
                bufferItem,
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
            this.debug('`this.logBuffer` was empty. pushing new buffer item', { logBuffer: this.logBuffer, bufferItem });
            this.logBuffer.push(bufferItem);
        }
        /* this will setup the debounce timer (if it is not already running) */
        this.debug('calling sendLogsToServer()', { logBuffer: this.logBuffer });
        this.sendLogsToServer();
    }
    sendAllLogsInstantly() {
        /* don't want this to be async because this is called from the window 'unload' event */
        /* this will send any queued up requests */
        return this.logUploader.sendEntireQueue()
            .concat(
        /* this will send any items in the buffer still */
        this.logBuffer.map((item) => this.logUploader.postLogsToEndpointInstantly(this.convertToRequestParams(item.traces.reverse()), { saveOnFailure: true })));
    }
    sendLogsToServer(immediate = false) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.logBuffer.length) {
                /* clear timer */
                clearTimeout(this.debounceTimer);
                this.debounceTimer = null;
                this.debug('buffer empty, not sending http request');
                return;
            }
            /* if we aren't sending immediately, then setup the timer */
            if (!immediate) {
                if (!this.debounceTimer) {
                    this.debug(`sendLogsToServer() 'immediate' is false. setting up 'debounceTimer' to ${this.debounceLogUploadTime}ms`);
                    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
                    this.debounceTimer = setTimeout(() => this.sendLogsToServer(true), this.debounceLogUploadTime);
                }
                else {
                    this.debug(`sendLogsToServer() 'immediate' is false. 'debounceTimer' is already running`);
                }
                return;
            }
            /* clear timer */
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
            /* grab the first item to send (remove it from the list) */
            const [bufferItem] = this.logBuffer.splice(0, 1);
            try {
                // this.pendingHttpRequest = true;
                this.debug('calling logUploader.postLogsToEndpoint() with', { bufferItem, newLogBuffer: this.logBuffer });
                yield this.logUploader.postLogsToEndpoint(this.convertToRequestParams(bufferItem.traces.reverse()));
            }
            catch (err) {
                this.logger.emit('onError', err);
                this.logger.error('Error sending logs to server', err, { skipServer: true });
                /* no-op: the uploader will attempt reties. if the uploader throws, it means this log isn't going to make to the server */
                /* TODO: figure out why the error structure changed and determine if this is necessary */
                const statusCode = (err === null || err === void 0 ? void 0 : err.status)
                    ? parseInt(err.status, 10)
                    : parseInt((_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status, 10);
                if ([401, 403, 404].includes(statusCode)) {
                    this.logger.warn(`received a ${statusCode} from logUploader. stopping logging to server`);
                    this.logger.stopServerLogging();
                }
            }
            finally {
                /* setup the debounce again */
                this.sendLogsToServer();
            }
        });
    }
    truncateLog(logLevel, log) {
        let trace;
        let truncatedTraceSize;
        const originalTraceSize = calculateLogMessageSize(this.convertToTrace(logLevel, log));
        const logCopy = deepClone(log);
        const truncText = '[[TRUNCATED]]';
        if (!logCopy) {
            return null;
        }
        /* first truncate the details */
        logCopy.details = truncText;
        trace = this.convertToTrace(logLevel, logCopy);
        truncatedTraceSize = calculateLogMessageSize(trace);
        if (truncatedTraceSize <= MAX_LOG_SIZE) {
            this.logger.warn('message too large to send to server. truncated log details', {
                originalLog: log,
                truncatedLog: logCopy,
                originalTraceSize,
                truncatedTraceSize,
                maxAllowedTraceSize: MAX_LOG_SIZE
            }, { skipServer: true });
            return trace;
        }
        /* second truncate the message */
        logCopy.message = `${logCopy.message.substr(0, 150)}... ${truncText}`;
        trace = this.convertToTrace(logLevel, logCopy);
        truncatedTraceSize = calculateLogMessageSize(trace);
        if (truncatedTraceSize <= MAX_LOG_SIZE) {
            this.logger.warn('message too large to send to server. truncated log details & log message', {
                originalLog: log,
                truncatedLog: logCopy,
                originalTraceSize,
                truncatedTraceSize,
                maxAllowedTraceSize: MAX_LOG_SIZE
            }, { skipServer: true });
            return trace;
        }
        /* if the truncated trace is _still_ too large, return null because we aren't going to send this to the server */
        return null;
    }
    convertToLogMessage(message, details) {
        const log = {
            clientTime: new Date().toISOString(),
            clientId: this.logger.clientId,
            message,
            details
        };
        const { originAppName, originAppVersion, originAppId } = this.logger.config;
        /* only add these if they are configured */
        if (originAppName) {
            log.originAppName = originAppName;
            log.originAppVersion = originAppVersion;
            log.originAppId = originAppId;
        }
        return log;
    }
    convertToTrace(level, log) {
        return {
            topic: this.logger.config.appName,
            level: level.toUpperCase(),
            message: stringify(log)
        };
    }
    convertToRequestParams(traces) {
        return {
            accessToken: this.logger.config.accessToken,
            app: {
                appId: this.logger.config.appName,
                appVersion: this.logger.config.appVersion
            },
            traces
        };
    }
    debug(message, details) {
        if (!this.logger.config.debugMode) {
            return;
        }
        /* tslint:disable-next-line:no-console */
        console.log(`%c [DEBUG:${this.logger.config.appName}] ${message}`, 'color: #32a852', deepClone(details));
    }
}
