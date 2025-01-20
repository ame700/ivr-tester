import { ILogger, LogFormatterFn, LogLevel } from 'genesys-cloud-client-logger';
import { AxiosError, ResponseType } from 'axios';
import { NamedAgent } from './named-agent';
import { JingleReasonCondition } from 'stanza/Constants';
export { ILogger, LogLevel };
export interface IClientOptions {
    host: string;
    apiHost?: string;
    authToken?: string;
    jwt?: string;
    jid?: string;
    jidResource?: string;
    reconnectOnNoLongerSubscribed?: boolean;
    optOutOfWebrtcStatsTelemetry?: boolean;
    allowIPv6?: boolean;
    logger?: ILogger;
    logLevel?: LogLevel;
    logFormatters?: LogFormatterFn[];
    signalIceConnected?: boolean;
    useServerSidePings?: boolean;
    appName?: string;
    appVersion?: string;
    appId?: string;
    customHeaders?: ICustomHeader;
}
export interface ICustomHeader {
    [header: string]: string;
}
export interface IClientConfig {
    host: string;
    apiHost: string;
    authToken?: string;
    jwt?: string;
    jid?: string;
    jidResource?: string;
    channelId: string;
    appName?: string;
    appVersion?: string;
    appId?: string;
    logLevel?: LogLevel;
    customHeaders?: ICustomHeader;
}
export interface ExtendedRTCIceServer extends RTCIceServer {
    type: string;
}
export declare type RequestApiOptions = {
    method: 'get' | 'post' | 'patch' | 'put' | 'delete';
    host: string;
    data?: any;
    version?: string;
    responseType?: ResponseType;
    contentType?: string;
    authToken?: string;
    logger?: any;
    noAuthHeader?: boolean;
    requestTimeout?: number;
    customHeaders?: ICustomHeader;
};
export interface IAxiosResponseError extends AxiosError {
    text: string;
}
export interface ISuperagentNetworkError extends Error {
    status: number | undefined;
    method: string;
    url: string;
    crossDomain: boolean;
}
export interface ISuperagentResponseError {
    original?: any;
    status: number;
    response: {
        body: any;
        error: ISuperagentNetworkError;
        header: {
            [key: string]: string;
        };
        headers: {
            [key: string]: string;
        };
        status: number;
        statusCode: number;
        statusText: string;
        text: string;
        req: {
            method: string;
            _data?: string;
        };
    };
}
export interface INetworkError extends IError {
    status: number;
    method: string;
    url: string;
    crossDomain: boolean;
}
export interface IResponseError extends IError {
    status: number;
    correlationId: string;
    responseBody: string;
    method: string;
    requestBody: string;
    url: string;
}
export interface IError {
    message: string;
    name: string;
    stack?: string;
}
export declare type SessionTypesAsStrings = 'softphone' | 'screenShare' | 'screenRecording' | 'collaborateVideo' | 'unknown';
export declare enum SessionTypes {
    softphone = "softphone",
    collaborateVideo = "collaborateVideo",
    acdScreenShare = "screenShare",
    screenRecording = "screenRecording",
    unknown = "unknown"
}
export interface ISessionInfo extends IPendingSession {
}
export interface IPendingSession {
    sessionId: string;
    id: string;
    autoAnswer: boolean;
    toJid: string;
    fromJid: string;
    conversationId: string;
    originalRoomJid?: string;
    sdpOverXmpp?: boolean;
    privAnswerMode?: 'Auto';
    fromUserId?: string;
    roomJid?: string;
    accepted?: boolean;
    meetingId?: string;
    sessionType: SessionTypes | SessionTypesAsStrings;
}
export interface StreamingClientExtension {
    handleIq?: Function;
    handleMessage?: Function;
    handleStanzaInstanceChange: (stanzaInstance: NamedAgent) => void;
    expose: any;
}
export interface StreamingClientConnectOptions {
    /**
     * @deprecated since version 15.1.1. Please use maxConnectionAttempts instead
     */
    keepTryingOnFailure?: boolean;
    maxConnectionAttempts?: number;
    maxDelayBetweenConnectionAttempts?: number;
}
export declare type GenesysWebrtcBaseParams = {
    sessionId: string;
};
export declare type GenesysWebrtcSdpParams = GenesysWebrtcBaseParams & {
    sdp: string;
};
export declare type GenesysWebrtcOfferParams = GenesysWebrtcSdpParams & {
    conversationId: string;
    reinvite?: boolean;
};
export declare type GenesysInfoActiveParams = GenesysWebrtcBaseParams & {
    status: 'active';
};
export declare type GenesysSessionTerminateParams = GenesysWebrtcBaseParams & {
    reason?: JingleReasonCondition;
};
export declare type GenesysWebrtcMuteParams = GenesysWebrtcBaseParams & {
    type: 'audio' | 'video';
};
export declare type TypedJsonRpcMessage<Method extends string, Params> = {
    jsonrpc: string;
    method: Method;
    id?: string;
    params?: Params;
};
export declare type JsonRpcMessage = TypedJsonRpcMessage<string, any>;
export declare type GenesysWebrtcOffer = TypedJsonRpcMessage<'offer', GenesysWebrtcOfferParams>;
export declare type GenesysWebrtcAnswer = TypedJsonRpcMessage<'answer', GenesysWebrtcSdpParams>;
export declare type GenesysWebrtcInfo = TypedJsonRpcMessage<'info', GenesysInfoActiveParams>;
export declare type GenesysWebrtcIceCandidate = TypedJsonRpcMessage<'iceCandidate', GenesysWebrtcSdpParams>;
export declare type GenesysWebrtcTerminate = TypedJsonRpcMessage<'terminate', GenesysSessionTerminateParams>;
export declare type GenesysWebrtcMute = TypedJsonRpcMessage<'mute', GenesysWebrtcMuteParams>;
export declare type GenesysWebrtcUnmute = TypedJsonRpcMessage<'unmute', GenesysWebrtcMuteParams>;
export declare type GenesysWebrtcJsonRpcMessage = GenesysWebrtcOffer | GenesysWebrtcAnswer | GenesysWebrtcInfo | GenesysWebrtcIceCandidate | GenesysWebrtcTerminate | GenesysWebrtcMute | GenesysWebrtcUnmute;
export declare type HeadsetControlsRequestType = 'mediaHelper' | 'standard' | 'prioritized';
export declare type HeadsetControlsRejectionReason = 'activeCall' | 'mediaHelper' | 'priority';
export declare type HeadsetControlsRejectionParams = {
    requestId: string;
    reason: HeadsetControlsRejectionReason;
};
export declare type HeadsetControlsChangedParams = {
    hasControls: boolean;
};
export declare type HeadsetControlsRequest = TypedJsonRpcMessage<'headsetControlsRequest', {
    requestType: HeadsetControlsRequestType;
}>;
export declare type HeadsetControlsRejection = TypedJsonRpcMessage<'headsetControlsRejection', HeadsetControlsRejectionParams>;
export declare type HeadsetControlsChanged = TypedJsonRpcMessage<'headsetControlsChanged', HeadsetControlsChangedParams>;
export declare type GenesysMediaMessage = HeadsetControlsRequest | HeadsetControlsRejection | HeadsetControlsChanged;
export declare type FlatObject = {
    [key: string]: string | number | boolean | null | Date;
};
export declare type GenericAction = {
    _eventType: string;
};
export declare type InsightReport = {
    appName: string;
    appVersion: string;
    originAppName?: string;
    originAppVersion?: string;
    actions: InsightAction<any>[];
};
export declare type InsightAction<T extends {
    _eventType: string;
}> = {
    actionName: 'WebrtcStats';
    details: InsightActionDetails<T>;
};
export declare type InsightActionDetails<K extends {
    _eventType: string;
}> = {
    _eventType: K['_eventType'];
    /**
     * This should be ms since epoch, e.g. new Date().getTime()
     */
    _eventTimestamp: number;
    _appId?: string;
    _appName?: string;
    _appVersion?: string;
} & K;
export declare type OnlineStatusStat = InsightAction<{
    _eventType: 'onlineStatus';
    online: boolean;
}>;
export declare type FirstProposeStat = InsightAction<{
    _eventType: 'firstPropose';
    sdpViaXmppRequested: boolean;
    sessionType: SessionTypesAsStrings;
    originAppId?: string;
    conversationId: string;
    sessionId: string;
}>;
export declare type FirstAlertingConversationStat = InsightAction<{
    _eventType: 'firstAlertingConversationUpdate';
    conversationId: string;
    participantId: string;
}>;
export declare type MediaStat = InsightAction<{
    _eventType: 'mediaRequested' | 'mediaStarted' | 'mediaError';
    requestId?: string;
    message?: string;
    audioRequested: boolean;
    videoRequested: boolean;
    displayRequested: boolean;
    conversationId?: string;
    sessionType?: SessionTypesAsStrings;
    sessionId?: string;
    elapsedMsFromInitialRequest?: number;
}>;
export declare type NRProxyStat = FirstAlertingConversationStat | MediaStat;
export declare type SCConnectionData = {
    currentDelayMs: number;
    delayMsAfterNextReduction?: number;
    nextDelayReductionTime?: number;
    timeOfTotalReset?: number;
};
