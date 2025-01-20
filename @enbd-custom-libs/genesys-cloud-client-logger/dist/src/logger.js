"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var events_1 = require("events");
var uuid_1 = require("uuid");
var safe_json_stringify_1 = __importDefault(require("safe-json-stringify"));
var server_logger_1 = require("./server-logger");
var Logger = /** @class */ (function (_super) {
    __extends(Logger, _super);
    /* eslint-enable @typescript-eslint/naming-convention */
    function Logger(config) {
        var _this = _super.call(this) || this;
        _this.defaultFormatter = function (logLevel, message, details, messageOptions, next) {
            if (messageOptions.skipDefaultFormatter) {
                return next();
            }
            if (message instanceof Error) {
                details = details || message;
                message = message.message;
            }
            var prefix = _this.config.appName ? "[".concat(_this.config.appName, "] ") : '';
            message = "".concat(prefix).concat(message);
            next(logLevel, message, details, messageOptions);
        };
        _this.logMessage = function (logLevel, message, details, messageOptions) {
            if (!messageOptions.skipSecondaryLogger) {
                try {
                    /* log to secondary logger (default is console) */
                    var params = [message];
                    if (typeof details !== 'undefined') {
                        params.push(_this.config.stringify ? (0, safe_json_stringify_1.default)(details) : details);
                    }
                    /* eslint-disable-next-line prefer-spread */
                  //  _this.secondaryLogger[logLevel].apply(_this.secondaryLogger, params);
                }
                catch (error) {
                    /* don't let custom logger errors stop our logger */
                    console.error('Error logging using custom logger passed into `genesys-cloud-client-logger`', { error: error, secondaryLogger: _this.secondaryLogger, message: message, details: details, messageOptions: messageOptions });
                }
            }
            /* log to the server */
            if (!messageOptions.skipServer &&
                !_this.stopReason &&
                _this.serverLogger &&
                _this.logRank(logLevel) >= _this.logRank(_this.config.logLevel)) {
                _this.serverLogger.addLogToSend(logLevel, message, details);
            }
        };
        Object.defineProperty(_this, 'clientId', {
            value: (0, uuid_1.v4)(),
            writable: false
        });
        _this.config = __assign({}, config);
        _this.secondaryLogger = _this.config.logger || console;
        delete _this.config.logger;
        if (_this.logRank(_this.config.logLevel) === -1) {
            if (config.logLevel) {
                _this.warn("Invalid log level: \"".concat(config.logLevel, "\". Default \"info\" will be used instead."), null, { skipServer: true });
            }
            _this.config.logLevel = 'info';
        }
        /* do this for (unofficial) backwards compat */
        if (!config.appName && config.logTopic) {
            _this.warn('`logTopic` has been renamed to `appName`. Please use `appName`', null, { skipServer: true });
            _this.config.appName = config.logTopic;
        }
        /* default to always set up server logging */
        if (_this.config.initializeServerLogging !== false) {
            _this.serverLogger = new server_logger_1.ServerLogger(_this);
        }
        if (_this.config.startServerLoggingPaused) {
            _this.stopServerLogging();
        }
        return _this;
    }
    Object.defineProperty(Logger.prototype, "VERSION", {
        get: function () {
            return Logger.VERSION;
        },
        enumerable: false,
        configurable: true
    });
    Logger.prototype.setAccessToken = function (token) {
        this.config.accessToken = token;
        /* if we stopped because of a 401, we will try to start again */
        /* eslint-disable eqeqeq */
        if (this.stopReason == 401) {
            this.startServerLogging();
        }
        /* eslint-enable eqeqeq */
    };
    Logger.prototype.log = function (message, details, opts) {
        this.formatMessage('log', message, details, opts);
    };
    Logger.prototype.debug = function (message, details, opts) {
        this.formatMessage('debug', message, details, opts);
    };
    Logger.prototype.info = function (message, details, opts) {
        this.formatMessage('info', message, details, opts);
    };
    Logger.prototype.warn = function (message, details, opts) {
        this.formatMessage('warn', message, details, opts);
    };
    Logger.prototype.error = function (message, details, opts) {
        this.formatMessage('error', message, details, opts);
    };
    /**
     * Start sending logs to the server. Only applies if
     * the logger instance was configured with server logging.
     *
     * @returns void
     */
    Logger.prototype.startServerLogging = function () {
        this.stopReason = undefined;
        if (!this.serverLogger) {
            return this.warn('`startServerLogging` called but the logger instance is not configured to ' +
                'send logs to the server. Ignoring call to start sending logs to server.', undefined, { skipServer: true });
        }
        this.emit('onStart');
    };
    /**
     * Stop sending logs to the server. Note; this will clear
     * any items that are currently in the buffer. If you wish
     * to send any currently pending log items, use
     * `sendAllLogsInstantly()` before stopping the server loggin.
     *
     * @param reason optional; default `'force'`
     * @returns void
     */
    Logger.prototype.stopServerLogging = function (reason) {
        if (reason === void 0) { reason = 'force'; }
        /* we never want to override a force stop */
        if (this.stopReason === 'force' && reason !== 'force') {
            return;
        }
        this.stopReason = reason;
        this.emit('onStop', reason);
    };
    /**
     * Force send all pending log items to the server.
     *
     * @returns an array of HTTP request promises
     */
    Logger.prototype.sendAllLogsInstantly = function () {
        var _a;
        return ((_a = this.serverLogger) === null || _a === void 0 ? void 0 : _a.sendAllLogsInstantly()) || [];
    };
    Logger.prototype.formatMessage = function (level, message, details, opts) {
        var formatters = [this.defaultFormatter.bind(this)];
        if (this.config.formatters) {
            formatters = __spreadArray(__spreadArray([], this.config.formatters, true), [this.defaultFormatter.bind(this)], false);
        }
        this.callNextFormatter(formatters, level, message, details, opts);
    };
    Logger.prototype.callNextFormatter = function (formatters, level, message, details, opts) {
        var _this = this;
        if (opts === void 0) { opts = {}; }
        var formatter = formatters[0], remainingFormatters = formatters.slice(1);
        if (!formatter) {
            return this.logMessage(level, message, details, opts);
        }
        var next = function (newLevel, newMessage, newDetails, newOpts) {
            // next was called with params
            if (typeof newLevel !== 'undefined') {
                _this.callNextFormatter(remainingFormatters, newLevel, newMessage, newDetails, newOpts);
            }
            else {
                _this.callNextFormatter(remainingFormatters, level, message, details, opts);
            }
        };
        formatter(level, message, details, opts, next);
    };
    Logger.prototype.logRank = function (level) {
        switch (level) {
            case 'log':
                return 0;
            case 'debug':
                return 1;
            case 'info':
                return 2;
            case 'warn':
                return 3;
            case 'error':
                return 4;
            default:
                return -1; // for invalid logLevel
        }
    };
    /* eslint-disable @typescript-eslint/naming-convention */
    Logger.VERSION = '4.2.13';
    return Logger;
}(events_1.EventEmitter));
exports.Logger = Logger;
