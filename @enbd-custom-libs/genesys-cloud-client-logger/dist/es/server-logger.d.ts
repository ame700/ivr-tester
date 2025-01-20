import { Logger } from './logger';
import { LogLevel } from './interfaces';
export declare class ServerLogger {
    private isInitialized;
    private logger;
    private logBuffer;
    private debounceLogUploadTime;
    private debounceTimer;
    private logUploader;
    constructor(logger: Logger);
    addLogToSend(logLevel: LogLevel, message: string, details?: any): void;
    sendAllLogsInstantly(): Promise<any>[];
    private sendLogsToServer;
    private truncateLog;
    private convertToLogMessage;
    private convertToTrace;
    private convertToRequestParams;
    private debug;
}
