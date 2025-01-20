import { ICustomHeaders, IDeferred, ILogRequest, ISendLogRequest } from './interfaces';
export interface IQueueItem {
    deferred: IDeferred;
    requestParams: ISendLogRequest;
}
export declare const getOrCreateLogUploader: (url: string, debugMode?: boolean, useUniqueLogUploader?: boolean, customHeaders?: ICustomHeaders) => LogUploader;
export declare class LogUploader {
    private url;
    private debugMode;
    private customHeaders?;
    sendQueue: IQueueItem[];
    private retryAfter?;
    private pendingRequest?;
    constructor(url: string, debugMode?: boolean, customHeaders?: ICustomHeaders | undefined);
    postLogsToEndpoint(requestParams: ISendLogRequest): Promise<any>;
    postLogsToEndpointInstantly(requestParams: ISendLogRequest, opts?: {
        saveOnFailure: boolean;
    }): Promise<any>;
    saveRequestForLater(request: ISendLogRequest): void;
    getSavedRequests(): ILogRequest[] | undefined;
    sendEntireQueue(): Promise<any>[];
    resetSendQueue(): void;
    private sendNextQueuedLogToServer;
    private handleBackoffError;
    private retryAfterTimerCheck;
    private backoffFn;
    private sendPostRequest;
    private debug;
}
