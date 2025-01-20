import { EventEmitter } from 'events';
import { ILoggerConfig, ILogger, StopReason, LoggerEvents } from './interfaces';
import { ILogMessageOptions } from '.';
import StrictEventEmitter from 'strict-event-emitter-types/types/src';
declare const Logger_base: new () => StrictEventEmitter<EventEmitter, LoggerEvents>;
export declare class Logger extends Logger_base implements ILogger {
    readonly clientId: string;
    config: ILoggerConfig;
    private serverLogger;
    private secondaryLogger;
    private stopReason?;
    static VERSION: string;
    get VERSION(): string;
    constructor(config: ILoggerConfig);
    setAccessToken(token: string): void;
    log(message: string | Error, details?: any, opts?: ILogMessageOptions): void;
    debug(message: string | Error, details?: any, opts?: ILogMessageOptions): void;
    info(message: string | Error, details?: any, opts?: ILogMessageOptions): void;
    warn(message: string | Error, details?: any, opts?: ILogMessageOptions): void;
    error(message: string | Error, details?: any, opts?: ILogMessageOptions): void;
    /**
     * Start sending logs to the server. Only applies if
     * the logger instance was configured with server logging.
     *
     * @returns void
     */
    startServerLogging(): void;
    /**
     * Stop sending logs to the server. Note; this will clear
     * any items that are currently in the buffer. If you wish
     * to send any currently pending log items, use
     * `sendAllLogsInstantly()` before stopping the server loggin.
     *
     * @param reason optional; default `'force'`
     * @returns void
     */
    stopServerLogging(reason?: StopReason): void;
    /**
     * Force send all pending log items to the server.
     *
     * @returns an array of HTTP request promises
     */
    sendAllLogsInstantly(): Promise<any>[];
    private formatMessage;
    private callNextFormatter;
    private defaultFormatter;
    private logMessage;
    private logRank;
}
export {};
