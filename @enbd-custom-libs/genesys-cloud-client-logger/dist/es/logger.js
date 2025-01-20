import { EventEmitter } from 'events';
import { v4 } from 'uuid';
import stringify from 'safe-json-stringify';
import { ServerLogger } from './server-logger';
export class Logger extends EventEmitter {
    /* eslint-enable @typescript-eslint/naming-convention */
    constructor(config) {
        super();
        this.defaultFormatter = (logLevel, message, details, messageOptions, next) => {
            if (messageOptions.skipDefaultFormatter) {
                return next();
            }
            if (message instanceof Error) {
                details = details || message;
                message = message.message;
            }
            const prefix = this.config.appName ? `[${this.config.appName}] ` : '';
            message = `${prefix}${message}`;
            next(logLevel, message, details, messageOptions);
        };
        this.logMessage = (logLevel, message, details, messageOptions) => {
            if (!messageOptions.skipSecondaryLogger) {
                try {
                    /* log to secondary logger (default is console) */
                    const params = [message];
                    if (typeof details !== 'undefined') {
                        params.push(this.config.stringify ? stringify(details) : details);
                    }
                    /* eslint-disable-next-line prefer-spread */
                    this.secondaryLogger[logLevel].apply(this.secondaryLogger, params);
                }
                catch (error) {
                    /* don't let custom logger errors stop our logger */
                    console.error('Error logging using custom logger passed into `genesys-cloud-client-logger`', { error, secondaryLogger: this.secondaryLogger, message, details, messageOptions });
                }
            }
            /* log to the server */
            if (!messageOptions.skipServer &&
                !this.stopReason &&
                this.serverLogger &&
                this.logRank(logLevel) >= this.logRank(this.config.logLevel)) {
                this.serverLogger.addLogToSend(logLevel, message, details);
            }
        };
        Object.defineProperty(this, 'clientId', {
            value: v4(),
            writable: false
        });
        this.config = Object.assign({}, config);
        this.secondaryLogger = this.config.logger || console;
        delete this.config.logger;
        if (this.logRank(this.config.logLevel) === -1) {
            if (config.logLevel) {
                this.warn(`Invalid log level: "${config.logLevel}". Default "info" will be used instead.`, null, { skipServer: true });
            }
            this.config.logLevel = 'info';
        }
        /* do this for (unofficial) backwards compat */
        if (!config.appName && config.logTopic) {
            this.warn('`logTopic` has been renamed to `appName`. Please use `appName`', null, { skipServer: true });
            this.config.appName = config.logTopic;
        }
        /* default to always set up server logging */
        if (this.config.initializeServerLogging !== false) {
            this.serverLogger = new ServerLogger(this);
        }
        if (this.config.startServerLoggingPaused) {
            this.stopServerLogging();
        }
    }
    get VERSION() {
        return Logger.VERSION;
    }
    setAccessToken(token) {
        this.config.accessToken = token;
        /* if we stopped because of a 401, we will try to start again */
        /* eslint-disable eqeqeq */
        if (this.stopReason == 401) {
            this.startServerLogging();
        }
        /* eslint-enable eqeqeq */
    }
    log(message, details, opts) {
        this.formatMessage('log', message, details, opts);
    }
    debug(message, details, opts) {
        this.formatMessage('debug', message, details, opts);
    }
    info(message, details, opts) {
        this.formatMessage('info', message, details, opts);
    }
    warn(message, details, opts) {
        this.formatMessage('warn', message, details, opts);
    }
    error(message, details, opts) {
        this.formatMessage('error', message, details, opts);
    }
    /**
     * Start sending logs to the server. Only applies if
     * the logger instance was configured with server logging.
     *
     * @returns void
     */
    startServerLogging() {
        this.stopReason = undefined;
        if (!this.serverLogger) {
            return this.warn('`startServerLogging` called but the logger instance is not configured to ' +
                'send logs to the server. Ignoring call to start sending logs to server.', undefined, { skipServer: true });
        }
        this.emit('onStart');
    }
    /**
     * Stop sending logs to the server. Note; this will clear
     * any items that are currently in the buffer. If you wish
     * to send any currently pending log items, use
     * `sendAllLogsInstantly()` before stopping the server loggin.
     *
     * @param reason optional; default `'force'`
     * @returns void
     */
    stopServerLogging(reason = 'force') {
        /* we never want to override a force stop */
        if (this.stopReason === 'force' && reason !== 'force') {
            return;
        }
        this.stopReason = reason;
        this.emit('onStop', reason);
    }
    /**
     * Force send all pending log items to the server.
     *
     * @returns an array of HTTP request promises
     */
    sendAllLogsInstantly() {
        var _a;
        return ((_a = this.serverLogger) === null || _a === void 0 ? void 0 : _a.sendAllLogsInstantly()) || [];
    }
    formatMessage(level, message, details, opts) {
        let formatters = [this.defaultFormatter.bind(this)];
        if (this.config.formatters) {
            formatters = [...this.config.formatters, this.defaultFormatter.bind(this)];
        }
        this.callNextFormatter(formatters, level, message, details, opts);
    }
    callNextFormatter(formatters, level, message, details, opts = {}) {
        const [formatter, ...remainingFormatters] = formatters;
        if (!formatter) {
            return this.logMessage(level, message, details, opts);
        }
        const next = (newLevel, newMessage, newDetails, newOpts) => {
            // next was called with params
            if (typeof newLevel !== 'undefined') {
                this.callNextFormatter(remainingFormatters, newLevel, newMessage, newDetails, newOpts);
            }
            else {
                this.callNextFormatter(remainingFormatters, level, message, details, opts);
            }
        };
        formatter(level, message, details, opts, next);
    }
    logRank(level) {
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
    }
}
/* eslint-disable @typescript-eslint/naming-convention */
Logger.VERSION = '4.2.13';
