'use strict';
import { __awaiter } from "tslib";
import { TokenBucket } from 'limiter';
import { Logger } from 'genesys-cloud-client-logger';
import './polyfills';
import { Notifications } from './notifications';
import { WebrtcExtension } from './webrtc';
import { Ping } from './ping';
import { ServerMonitor } from './server-monitor';
import { delay, parseJwt, timeoutPromise } from './utils';
import { HttpClient } from './http-client';
import EventEmitter from 'events';
import { ConnectionManager } from './connection-manager';
import { backOff } from 'exponential-backoff';
import OfflineError from './types/offline-error';
import SaslError from './types/sasl-error';
import { TimeoutError } from './types/timeout-error';
import { MessengerExtension } from './messenger';
let extensions = {
    notifications: Notifications,
    webrtcSessions: WebrtcExtension,
    messenger: MessengerExtension
};
const STANZA_DISCONNECTED = 'stanzaDisconnected';
const NO_LONGER_SUBSCRIBED = 'notify:no_longer_subscribed';
const DUPLICATE_ID = 'notify:duplicate_id';
const MAX_CHANNEL_REUSES = 10;
const SESSION_STORE_KEY = 'sc_connectionData';
const BACKOFF_DECREASE_DELAY_MULTIPLIER = 5;
const INITIAL_DELAY = 2000;
export class Client extends EventEmitter {
    constructor(options) {
        super();
        this.connected = false;
        this.connecting = false;
        this.hardReconnectRequired = true;
        this.isGuest = false;
        this.backgroundAssistantMode = false;
        this.autoReconnect = true;
        this.extensions = [];
        this.channelReuses = 0;
        this.hasMadeInitialAttempt = false;
        this.http = new HttpClient();
        this.reconnectOnNoLongerSubscribed = options.reconnectOnNoLongerSubscribed !== false;
        this.useServerSidePings = options.useServerSidePings !== false;
        this.config = {
            host: options.host,
            apiHost: options.apiHost || options.host.replace('wss://streaming.', ''),
            authToken: options.authToken,
            jwt: options.jwt,
            jid: options.jid,
            jidResource: options.jidResource,
            channelId: null,
            appName: options.appName,
            appVersion: options.appVersion,
            appId: options.appId,
            customHeaders: options.customHeaders
        };
        this.backgroundAssistantMode = this.checkIsBackgroundAssistant();
        this.isGuest = !this.backgroundAssistantMode && !options.authToken;
        let loggerAccessToken = options.authToken || '';
        let loggerUrl = `https://api.${this.config.apiHost}/api/v2/diagnostics/trace`;
        if (this.backgroundAssistantMode) {
            loggerAccessToken = options.jwt;
            loggerUrl += '/backgroundassistant';
        }
        this.logger = new Logger({
            accessToken: loggerAccessToken,
            url: loggerUrl,
            uploadDebounceTime: 1000,
            initializeServerLogging: !this.isGuest && !options.optOutOfWebrtcStatsTelemetry,
            /* streaming-client logging info */
            appVersion: Client.version,
            appName: 'streaming-client',
            logLevel: this.config.logLevel || 'info',
            logger: options.logger || console,
            formatters: options.logFormatters,
            /* secondary/parent app info */
            originAppName: options.appName,
            originAppVersion: options.appVersion,
            originAppId: options.appId,
            customHeaders: options.customHeaders
        });
        this.connectionManager = new ConnectionManager(this.logger, this.config);
        Object.keys(extensions).forEach((extensionName) => {
            const extension = new extensions[extensionName](this, options);
            this.extensions.push(extension);
            if (!extension.tokenBucket) {
                // default rate limit
                // 20 stanzas per 1000 ms,
                // adding up to 25 stanzas over the course of the 1000ms
                // starting with 20 stanzas
                // = 45 stanzas max per 1000 ms
                // = 70 stanzas max per 2000 ms
                extension.tokenBucket = new TokenBucket(20, 25, 1000);
                extension.tokenBucket.content = 25;
            }
            if (typeof extension.on === 'function') {
                extension.on('send', this.handleSendEventFromExtension.bind(this, extension));
            }
            this[extensionName] = extension.expose;
            this[`_${extensionName}`] = extension;
        });
    }
    handleSendEventFromExtension(extension, data, message = false) {
        return extension.tokenBucket.removeTokens(1, () => {
            const stanza = this.activeStanzaInstance;
            if (!stanza) {
                return this.logger.warn('cannot send message, no active stanza client', { data, message }, { skipServer: true });
            }
            if (message === true) {
                return stanza.sendMessage(data);
            }
            return stanza.sendIQ(data);
        });
    }
    checkIsBackgroundAssistant() {
        if (this.config.jwt) {
            const jwt = parseJwt(this.config.jwt);
            return jwt && jwt.iss === 'urn:purecloud:screenrecording';
        }
        return false;
    }
    addInateEventHandlers(stanza) {
        // make sure we don't stack event handlers. There should only ever be *at most* one handler
        this.removeStanzaBoundEventHandlers();
        this.boundStanzaDisconnect = this.handleStanzaDisconnectedEvent.bind(this, stanza);
        this.boundStanzaNoLongerSubscribed = this.handleNoLongerSubscribed.bind(this, stanza);
        this.boundStanzaDuplicateId = this.handleDuplicateId.bind(this, stanza);
        this.on(STANZA_DISCONNECTED, this.boundStanzaDisconnect);
        this.on(NO_LONGER_SUBSCRIBED, this.boundStanzaNoLongerSubscribed);
        this.on(DUPLICATE_ID, this.boundStanzaDuplicateId);
        this.extensions.forEach(extension => {
            if (typeof extension.handleIq === 'function') {
                stanza.on('iq', extension.handleIq.bind(extension));
            }
            if (typeof extension.handleMessage === 'function') {
                stanza.on('message', extension.handleMessage.bind(extension));
            }
        });
    }
    removeStanzaBoundEventHandlers() {
        if (this.boundStanzaDisconnect) {
            this.off(STANZA_DISCONNECTED, this.boundStanzaDisconnect);
            this.boundStanzaDisconnect = undefined;
        }
        if (this.boundStanzaNoLongerSubscribed) {
            this.off(NO_LONGER_SUBSCRIBED, this.boundStanzaNoLongerSubscribed);
            this.boundStanzaNoLongerSubscribed = undefined;
        }
        if (this.boundStanzaDuplicateId) {
            this.off(DUPLICATE_ID, this.boundStanzaDuplicateId);
            this.boundStanzaDuplicateId = undefined;
        }
    }
    proxyStanzaEvents(stanza) {
        stanza.originalEmitter = stanza.emit;
        stanza.emit = (eventName, ...args) => {
            const hasListeners = stanza.originalEmitter(eventName, ...args);
            // there are a few events that need to be handled specially. stanza emits a `connected` event
            // which means the web socket connected but that doesn't mean it's not going to immediately close.
            // For this reason, we are going to equate the `session:started` event as "connected" which
            // essentially means the websocket connection is stable.
            //
            // we are also going to let streaming client control its own connected and disconnected state so
            // we will emit those events separately "when we are ready".
            // as per block comment, we'll ignore the connected event
            if (eventName === 'connected') {
                return hasListeners;
            }
            else if (eventName === 'disconnected') {
                eventName = STANZA_DISCONNECTED;
            }
            return this.emit(eventName, ...args);
        };
    }
    handleStanzaDisconnectedEvent(disconnectedInstance) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('stanzaDisconnected event received', { stanzaInstanceId: disconnectedInstance.id, channelId: disconnectedInstance.channelId });
            this.connected = false;
            this.connecting = false;
            (_a = disconnectedInstance.pinger) === null || _a === void 0 ? void 0 : _a.stop();
            (_b = disconnectedInstance.serverMonitor) === null || _b === void 0 ? void 0 : _b.stop();
            this.removeAllListeners(STANZA_DISCONNECTED);
            this.removeAllListeners(NO_LONGER_SUBSCRIBED);
            // unproxy events
            if (disconnectedInstance.originalEmitter) {
                disconnectedInstance.emit = disconnectedInstance.originalEmitter;
            }
            this.activeStanzaInstance = undefined;
            this.emit('disconnected', { reconnecting: this.autoReconnect });
            if (this.autoReconnect) {
                return this.connect({ keepTryingOnFailure: true });
            }
        });
    }
    handleNoLongerSubscribed(stanzaInstance) {
        var _a, _b;
        this.logger.warn('noLongerSubscribed event received', { stanzaInstanceId: stanzaInstance.id, channelId: stanzaInstance.channelId });
        (_a = stanzaInstance.pinger) === null || _a === void 0 ? void 0 : _a.stop();
        (_b = stanzaInstance.serverMonitor) === null || _b === void 0 ? void 0 : _b.stop();
        this.hardReconnectRequired = true;
        if (!this.reconnectOnNoLongerSubscribed) {
            this.autoReconnect = false;
        }
    }
    handleDuplicateId(stanzaInstance) {
        var _a, _b;
        this.logger.warn('duplicate_id event received, forcing hard reconnect', { stanzaInstanceId: stanzaInstance.id, channelId: stanzaInstance.channelId });
        (_a = stanzaInstance.pinger) === null || _a === void 0 ? void 0 : _a.stop();
        (_b = stanzaInstance.serverMonitor) === null || _b === void 0 ? void 0 : _b.stop();
        this.hardReconnectRequired = true;
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('streamingClient.disconnect was called');
            if (!this.activeStanzaInstance) {
                return;
            }
            return timeoutPromise(resolve => {
                this.autoReconnect = false;
                this.http.stopAllRetries();
                return this.activeStanzaInstance.disconnect()
                    .then(resolve);
            }, 5000, 'disconnecting streaming service');
        });
    }
    getSessionStoreKey() {
        const differentiator = this.config.appName || this.logger.clientId;
        return `${SESSION_STORE_KEY}_${differentiator}`;
    }
    getConnectionData() {
        const connectionDataStr = sessionStorage.getItem(this.getSessionStoreKey());
        const defaultValue = {
            currentDelayMs: 0,
        };
        if (connectionDataStr) {
            try {
                return JSON.parse(connectionDataStr);
            }
            catch (e) {
                this.logger.warn('failed to parse streaming client connection data');
                return defaultValue;
            }
        }
        return defaultValue;
    }
    setConnectionData(data) {
        sessionStorage.setItem(this.getSessionStoreKey(), JSON.stringify(data));
    }
    increaseBackoff() {
        const connectionData = this.getConnectionData();
        const currentDelay = Math.max(connectionData.currentDelayMs * 2, INITIAL_DELAY * 2);
        const newConnectionData = {
            currentDelayMs: currentDelay,
            delayMsAfterNextReduction: currentDelay / 2,
            nextDelayReductionTime: new Date().getTime() + (currentDelay * BACKOFF_DECREASE_DELAY_MULTIPLIER),
            timeOfTotalReset: new Date().getTime() + 1000 * 60 * 60 // one hour in the future
        };
        this.setConnectionData(newConnectionData);
        return newConnectionData;
    }
    decreaseBackoff(newAmountMs) {
        const data = this.getConnectionData();
        const msUntilNextReduction = newAmountMs * BACKOFF_DECREASE_DELAY_MULTIPLIER;
        const newConnectionData = {
            currentDelayMs: newAmountMs,
            delayMsAfterNextReduction: newAmountMs / 2,
            nextDelayReductionTime: new Date().getTime() + (msUntilNextReduction),
            timeOfTotalReset: data.timeOfTotalReset
        };
        // if we are past the total reset time, do that instead
        if (data.timeOfTotalReset && data.timeOfTotalReset < new Date().getTime() || newAmountMs < INITIAL_DELAY) {
            this.logger.debug('decreaseBackoff() called, but timeOfTotalReset has elasped or next delay is below 2s. Resetting backoff');
            return this.setConnectionData({
                currentDelayMs: 0
            });
        }
        this.setConnectionData(newConnectionData);
        clearTimeout(this.backoffReductionTimer);
        this.logger.debug('Setting timer for next backoff reduction since we haven\'t reached total reset', { msUntilReduction: msUntilNextReduction, delayMsAfterNextReduction: newConnectionData.delayMsAfterNextReduction });
        this.backoffReductionTimer = setTimeout(() => this.decreaseBackoff(newConnectionData.delayMsAfterNextReduction), msUntilNextReduction);
    }
    getStartingDelay(connectionData, maxDelay) {
        // we don't want the delay to ever be less than 2 seconds
        const minDelay = Math.max(connectionData.currentDelayMs, INITIAL_DELAY);
        if (connectionData.timeOfTotalReset && connectionData.timeOfTotalReset < new Date().getTime()) {
            return INITIAL_DELAY;
        }
        return Math.min(minDelay, maxDelay);
    }
    connect(connectOpts) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connecting) {
                const error = new Error('Already trying to connect streaming client');
                return this.logger.warn(error);
            }
            this.connecting = true;
            const maxDelay = (connectOpts === null || connectOpts === void 0 ? void 0 : connectOpts.maxDelayBetweenConnectionAttempts) || 90000;
            let maxAttempts = (connectOpts === null || connectOpts === void 0 ? void 0 : connectOpts.maxConnectionAttempts) || 1;
            // tslint:disable-next-line
            if (connectOpts === null || connectOpts === void 0 ? void 0 : connectOpts.keepTryingOnFailure) {
                // this maintains the previous functionality
                maxAttempts = Infinity;
            }
            clearTimeout(this.backoffReductionTimer);
            const connectionData = this.getConnectionData();
            const startingDelay = this.getStartingDelay(connectionData, maxDelay);
            const delayFirstAttempt = this.hasMadeInitialAttempt;
            this.hasMadeInitialAttempt = true;
            if (connectionData.currentDelayMs) {
                this.logger.debug('streamingClient.connect was called, but backoff is remembered', { currentDelayMs: connectionData.currentDelayMs, delayingThisAttempt: delayFirstAttempt, clientId: this.logger.clientId, appName: this.config.appName });
            }
            try {
                yield backOff(() => __awaiter(this, void 0, void 0, function* () {
                    const connectionData = this.getConnectionData();
                    yield this.makeConnectionAttempt();
                    if (connectionData.nextDelayReductionTime) {
                        const msUntilReduction = connectionData.nextDelayReductionTime - new Date().getTime();
                        this.logger.debug('Setting timer for next backoff reduction', { msUntilReduction, delayMsAfterNextReduction: connectionData.delayMsAfterNextReduction });
                        this.backoffReductionTimer = setTimeout(() => this.decreaseBackoff(connectionData.delayMsAfterNextReduction || 0), msUntilReduction);
                    }
                }), {
                    jitter: 'none',
                    maxDelay,
                    numOfAttempts: maxAttempts,
                    startingDelay,
                    delayFirstAttempt,
                    retry: this.backoffConnectRetryHandler.bind(this, {
                        maxConnectionAttempts: maxAttempts,
                    }),
                });
            }
            catch (err) {
                let error = err;
                if (!err) {
                    error = new Error('Streaming client connection attempted received and undefined error');
                }
                else if (err.name === 'AxiosError') {
                    const axiosError = err;
                    const config = axiosError.config || { url: undefined, method: undefined };
                    // sanitized error for logging
                    error = {
                        config: {
                            url: config.url,
                            method: config.method
                        },
                        status: (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status,
                        code: axiosError.code,
                        name: axiosError.name,
                        message: axiosError.message
                    };
                }
                this.logger.error('Failed to connect streaming client', { error });
                if (!err) {
                    throw error;
                }
                throw err;
            }
        });
    }
    backoffConnectRetryHandler(connectOpts, err, connectionAttempt) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            // if we exceed the `numOfAttempts` in the backoff config it still calls this retry fn and just ignores the result
            // if that's the case, we just want to bail out and ignore all the extra logging here.
            if (connectionAttempt >= connectOpts.maxConnectionAttempts) {
                return false;
            }
            const additionalErrorDetails = { connectionAttempt, error: err };
            if (!err) {
                additionalErrorDetails.error = new Error('streaming client backoff handler received undefined error');
            }
            else if (err.name === 'AxiosError') {
                const axiosError = err;
                const config = axiosError.config || { url: undefined, method: undefined };
                let sanitizedError = {
                    config: {
                        url: config.url,
                        method: config.method
                    },
                    status: (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status,
                    code: axiosError.code,
                    name: axiosError.name,
                    message: axiosError.message
                };
                additionalErrorDetails.error = sanitizedError;
                if ([401, 403].includes(((_b = err.response) === null || _b === void 0 ? void 0 : _b.status) || 0)) {
                    this.logger.error('Streaming client received an error that it can\'t recover from and will not attempt to reconnect', additionalErrorDetails);
                    return false;
                }
            }
            // if we get a sasl error, that means we made it all the way to the point of trying to open a websocket and
            // it was rejected for some reason. At this point we should do a hard reconnect then try again.
            if (err instanceof SaslError) {
                this.logger.info('hardReconnectRequired set to true due to sasl error');
                this.hardReconnectRequired = true;
                Object.assign(additionalErrorDetails, { channelId: err.channelId, stanzaInstanceId: err.stanzaInstanceId });
            }
            // we don't need to log the stack for a timeout message
            if (err instanceof TimeoutError) {
                additionalErrorDetails.error = err.message;
                const details = err.details;
                if (details) {
                    additionalErrorDetails.details = details;
                }
            }
            if (err === null || err === void 0 ? void 0 : err.response) {
                // This *should* be an axios error according to typings, but it appears this could be an AxiosError *or* and XmlHttpRequest
                // we'll check both to be safe
                const retryAfter = ((_c = err.response.headers) === null || _c === void 0 ? void 0 : _c['retry-after']) || ((_e = (_d = err.response).getResponseHeader) === null || _e === void 0 ? void 0 : _e.call(_d, 'retry-after'));
                if (retryAfter) {
                    // retry after comes in seconds, we need to return milliseconds
                    let retryDelay = parseInt(retryAfter, 10) * 1000;
                    additionalErrorDetails.retryDelay = retryDelay;
                    this.logger.error('Failed streaming client connection attempt, respecting retry-after header and will retry afterwards.', additionalErrorDetails, { skipServer: err instanceof OfflineError });
                    yield delay(retryDelay);
                    this.logger.debug('finished waiting for retry-after');
                    return true;
                }
            }
            const connectionData = this.increaseBackoff();
            this.logger.error('Failed streaming client connection attempt, retrying', additionalErrorDetails, { skipServer: err instanceof OfflineError });
            this.logger.debug('debug: retry info', { expectedRetryInMs: connectionData.currentDelayMs, appName: this.config.appName, clientId: this.logger.clientId });
            return true;
        });
    }
    makeConnectionAttempt() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!navigator.onLine) {
                throw new OfflineError('Browser is offline, skipping connection attempt');
            }
            let stanzaInstance;
            let previousConnectingState = this.connecting;
            try {
                yield this.prepareForConnect();
                stanzaInstance = yield this.connectionManager.getNewStanzaConnection();
                this.connected = true;
                this.connecting = false;
                this.addInateEventHandlers(stanzaInstance);
                this.proxyStanzaEvents(stanzaInstance);
                // handle any extension configuration
                for (const extension of this.extensions) {
                    if (extension.configureNewStanzaInstance) {
                        yield extension.configureNewStanzaInstance(stanzaInstance);
                    }
                }
                for (const extension of this.extensions) {
                    extension.handleStanzaInstanceChange(stanzaInstance);
                }
                this.activeStanzaInstance = stanzaInstance;
                yield this.setupConnectionMonitoring(stanzaInstance);
                this.emit('connected');
            }
            catch (err) {
                if (stanzaInstance) {
                    this.logger.error('Error occurred in connection attempt, but after websocket connected. Cleaning up connection so backoff is respected', { stanzaInstanceId: stanzaInstance.id, channelId: stanzaInstance.channelId });
                    this.removeStanzaBoundEventHandlers();
                    (_a = stanzaInstance.pinger) === null || _a === void 0 ? void 0 : _a.stop();
                    (_b = stanzaInstance.serverMonitor) === null || _b === void 0 ? void 0 : _b.stop();
                    yield stanzaInstance.disconnect();
                    this.connected = false;
                    this.connecting = previousConnectingState;
                }
                throw err;
            }
        });
    }
    setupConnectionMonitoring(stanzaInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            const setupClientPinger = (message) => {
                const logMessage = `${message}, falling back to client-side pinging`;
                this.logger.warn(logMessage, { stanzaInstanceId: stanzaInstance.id, channelId: stanzaInstance.channelId });
                stanzaInstance.pinger = new Ping(this, stanzaInstance);
            };
            if (this.useServerSidePings) {
                try {
                    // if this fails, then hawk doesn't support serverside pinging and we need to do client side pings
                    yield stanzaInstance.subscribeToNode(this._notifications.pubsubHost, 'enable.server.side.pings');
                    stanzaInstance.serverMonitor = new ServerMonitor(this, stanzaInstance);
                }
                catch (err) {
                    setupClientPinger('failed to establish server-side pinging');
                }
            }
            else {
                setupClientPinger('client configured to not use server-side pinging');
            }
        });
    }
    prepareForConnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.jwt) {
                this.hardReconnectRequired = false;
                return this.connectionManager.setConfig(this.config);
            }
            if (!this.hardReconnectRequired) {
                this.channelReuses++;
                if (this.channelReuses >= MAX_CHANNEL_REUSES) {
                    this.logger.warn('Forcing a hard reconnect due to max channel reuses', { channelId: this.config.channelId, channelReuses: this.channelReuses });
                    this.channelReuses = 0;
                    this.hardReconnectRequired = true;
                }
            }
            if (this.hardReconnectRequired) {
                let jidPromise;
                if (this.config.jid) {
                    jidPromise = Promise.resolve(this.config.jid);
                }
                else {
                    const jidRequestOpts = {
                        method: 'get',
                        host: this.config.apiHost,
                        authToken: this.config.authToken,
                        logger: this.logger,
                        customHeaders: this.config.customHeaders
                    };
                    jidPromise = this.http.requestApi('users/me', jidRequestOpts)
                        .then(res => res.data.chat.jabberId);
                }
                const channelRequestOpts = {
                    method: 'post',
                    host: this.config.apiHost,
                    authToken: this.config.authToken,
                    logger: this.logger,
                    customHeaders: this.config.customHeaders
                };
                const channelPromise = this.http.requestApi('notifications/channels?connectionType=streaming', channelRequestOpts)
                    .then(res => res.data.id);
                const [jid, channelId] = yield Promise.all([jidPromise, channelPromise]);
                this.config.jid = jid;
                this.config.channelId = channelId;
                this.autoReconnect = true;
                this.logger.info('attempting to connect streaming client on channel', { channelId });
                this.connectionManager.setConfig(this.config);
                this.hardReconnectRequired = false;
            }
        });
    }
    stopServerLogging() {
        /* flush all pending logs – then turn off the logger */
        this.logger.sendAllLogsInstantly();
        this.logger.stopServerLogging();
    }
    startServerLogging() {
        this.logger.startServerLogging();
    }
    setAccessToken(token) {
        this.config.authToken = token;
        this.logger.setAccessToken(token);
    }
    static extend(namespace, extension) {
        if (extensions[namespace]) {
            throw new Error(`Cannot register already existing namespace ${namespace}`);
        }
        extensions[namespace] = extension;
    }
    get version() {
        return Client.version;
    }
    static get version() {
        return '17.2.7';
    }
}
