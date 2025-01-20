import { __awaiter } from "tslib";
import { EventEmitter } from 'events';
import { toBare } from 'stanza/JID';
import LRU from 'lru-cache';
import { JingleAction } from 'stanza/Constants';
import { v4 } from 'uuid';
import throttle from 'lodash.throttle';
import { isFirefox } from 'browserama';
import { definitions } from './stanza-definitions/webrtc-signaling';
import { isAcdJid, isScreenRecordingJid, isSoftphoneJid, isVideoJid, calculatePayloadSize, retryPromise, iceIsDifferent } from './utils';
import { Client } from './client';
import { deepFlatten, formatStatsEvent } from './stats-formatter';
import { SessionTypes } from './types/interfaces';
import { StanzaMediaSession } from './types/stanza-media-session';
import { GenesysCloudMediaSession } from './types/genesys-cloud-media-session';
import { HttpClient } from './http-client';
const events = {
    REQUEST_WEBRTC_DUMP: 'requestWebrtcDump',
    /* jingle messaging */
    REQUEST_INCOMING_RTCSESSION: 'requestIncomingRtcSession',
    CANCEL_INCOMING_RTCSESSION: 'cancelIncomingRtcSession',
    HANDLED_INCOMING_RTCSESSION: 'handledIncomingRtcSession',
    OUTGOING_RTCSESSION_PROCEED: 'outgoingRtcSessionProceed',
    OUTGOING_RTCSESSION_REJECTED: 'outgoingRtcSessionRejected',
    // /* jingle */
    // RTC_ICESERVERS: 'rtcIceServers', // ice servers have been discovered
    INCOMING_RTCSESSION: 'incomingRtcSession',
    OUTGOING_RTCSESSION: 'outgoingRtcSession',
    RTCSESSION_ERROR: 'rtcSessionError' // jingle error occurred
    // TRACE_RTCSESSION: 'traceRtcSession', // trace messages for logging, etc
    // UPGRADE_MEDIA_ERROR: 'upgradeMediaError', // error occurred joining conference
    // /* other  */
    // UPDATE_MEDIA_PRESENCE: 'updateMediaPresence',
    // LASTN_CHANGE: 'lastNChange'
};
const desiredMaxStatsSize = 15000;
const MAX_DISCO_RETRIES = 2;
const ICE_SERVER_TIMEOUT = 15000; // 15 seconds
const ICE_SERVER_REFRESH_PERIOD = 1000 * 60 * 60 * 6; // 6 hours
export class WebrtcExtension extends EventEmitter {
    constructor(client, clientOptions) {
        super();
        this.ignoredSessions = new LRU({ max: 10, maxAge: 10 * 60 * 60 * 6 });
        this.pendingSessions = {};
        this.statsArr = [];
        this.throttleSendStatsInterval = 25000;
        this.currentMaxStatSize = desiredMaxStatsSize;
        this.statsSizeDecreaseAmount = 3000;
        this.statBuffer = 0;
        this.discoRetries = 0;
        this.iceServers = [];
        this.webrtcSessions = [];
        this.client = client;
        this.config = {
            allowIPv6: clientOptions.allowIPv6 === true,
            optOutOfWebrtcStatsTelemetry: clientOptions.optOutOfWebrtcStatsTelemetry
        };
        this.logger = client.logger;
        this.addEventListeners();
        this.throttledSendStats = throttle(this.sendStats.bind(this), this.throttleSendStatsInterval, { leading: false, trailing: true });
        this.client.on('jingle:outgoing', (session) => {
            this.logger.info('Emitting jingle:outgoing media-session (session-init)', session.sid);
            return this.emit(events.OUTGOING_RTCSESSION, session);
        });
        this.client.on('jingle:incoming', (session) => {
            this.logger.info('Emitting jingle:incoming media-session (session-init)', session.sid);
            return this.emit(events.INCOMING_RTCSESSION, session);
        });
        this.client.on('jingle:created', (session) => {
            // if this is not a JingleSession, this is a generic BaseSession from jingle, aka dummy session.
            // in this case, we can just kill this session because we will be using
            if (!(session instanceof StanzaMediaSession)) {
                session.end('cancel', true);
            }
        });
        window.addEventListener('offline', () => this.onOnlineStatusChange(false));
        window.addEventListener('online', () => this.onOnlineStatusChange(true));
    }
    get jid() {
        var _a;
        return (_a = this.stanzaInstance) === null || _a === void 0 ? void 0 : _a.jid;
    }
    onOnlineStatusChange(online) {
        this.addStatToQueue({
            actionName: 'WebrtcStats',
            details: {
                _eventType: 'onlineStatus',
                _eventTimestamp: new Date().getTime(),
                online,
            }
        });
    }
    handleStanzaInstanceChange(stanzaInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            this.stanzaInstance = stanzaInstance;
            if (this.refreshIceServersTimer) {
                clearInterval(this.refreshIceServersTimer);
                this.refreshIceServersTimer = null;
            }
            stanzaInstance.on('iq:set:genesysWebrtc', this.handleGenesysWebrtcStanza.bind(this));
            this.refreshIceServersTimer = setInterval(this.refreshIceServers.bind(this), ICE_SERVER_REFRESH_PERIOD);
            this.client.emit('sessionManagerChange', stanzaInstance);
        });
    }
    configureNewStanzaInstance(stanzaInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            Object.assign(stanzaInstance.jingle.config.peerConnectionConfig, {
                sdpSemantics: 'unified-plan'
            });
            yield this.configureStanzaIceServers(stanzaInstance);
            stanzaInstance.stanzas.define(definitions);
            stanzaInstance.jingle.prepareSession = this.prepareSession.bind(this);
            stanzaInstance.jingle.on('log', (level, message, data) => {
                this.logger[level](message, data);
            });
            const eventsToProxy = [
                'iceConnectionType',
                'peerTrackAdded',
                'peerTrackRemoved',
                'mute',
                'unmute',
                'sessionState',
                'connectionState',
                'terminated',
                'stats',
                'endOfCandidates'
            ];
            for (const e of eventsToProxy) {
                stanzaInstance.jingle.on(e, (session, ...data) => {
                    if (!(session instanceof StanzaMediaSession)) {
                        return;
                    }
                    session.emit(e, ...data);
                });
            }
        });
    }
    configureStanzaIceServers(stanzaInstance) {
        /* clear out stanzas default use of google's stun server */
        stanzaInstance.jingle.config.iceServers = [];
        /**
         * NOTE: calling this here should not interfere with the `webrtc.ts` extension
         *  refreshingIceServers since that is async and this constructor is sync
         */
        this.setIceServers([], stanzaInstance);
        return this._refreshIceServers(stanzaInstance);
    }
    handleGenesysOffer(iq) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = iq.genesysWebrtc;
            const params = message.params;
            const ignoreHostCandidatesForForceTurnFF = this.getIceTransportPolicy() === 'relay' && isFirefox;
            const commonParams = {
                id: params.sessionId,
                logger: this.logger,
                peerID: iq.from,
                fromJid: iq.from,
                sessionType: this.getSessionTypeByJid(iq.from),
                conversationId: params.conversationId,
                ignoreHostCandidatesFromRemote: ignoreHostCandidatesForForceTurnFF,
                optOutOfWebrtcStatsTelemetry: !!this.config.optOutOfWebrtcStatsTelemetry,
                allowIPv6: this.config.allowIPv6,
                iceServers: this.iceServers,
                reinvite: !!params.reinvite,
                iceTransportPolicy: this.getIceTransportPolicy()
            };
            let mediaSessionParams;
            // we should only do something if the pending session tells us to
            const pendingSession = this.pendingSessions[params.sessionId];
            if (pendingSession) {
                mediaSessionParams = Object.assign(Object.assign({}, commonParams), { meetingId: pendingSession.meetingId, fromUserId: pendingSession.fromUserId, originalRoomJid: pendingSession.originalRoomJid, privAnswerMode: pendingSession.privAnswerMode });
            }
            else {
                mediaSessionParams = commonParams;
            }
            // if we receive an offer for an existing session and the ice info has not changed, this is
            // a renogotiate. If the ice has changed, it's a re-invite and we need to create a new session.
            const existingSession = this.webrtcSessions.find(s => s.id === mediaSessionParams.id);
            this.logger.info('offer received', { existingSession: !!existingSession, mediaSessionParams });
            if (existingSession) {
                existingSession.conversationId = params.conversationId;
                // renego
                if (!iceIsDifferent(existingSession.peerConnection.remoteDescription.sdp, params.sdp)) {
                    return this.handleGenesysRenegotiate(existingSession, params.sdp);
                }
            }
            // reinvite/new session handled the same way here
            const session = new GenesysCloudMediaSession(this, mediaSessionParams);
            yield session.setRemoteDescription(params.sdp);
            this.proxyStatsForSession(session);
            session.on('sendIq', (iq) => { var _a; return (_a = this.stanzaInstance) === null || _a === void 0 ? void 0 : _a.sendIQ(iq); });
            session.on('terminated', () => {
                this.webrtcSessions = this.webrtcSessions.filter(s => s.id !== session.id);
            });
            this.webrtcSessions.push(session);
            this.logger.info('emitting sdp media-session (offer)');
            return this.emit(events.INCOMING_RTCSESSION, session);
        });
    }
    handleGenesysRenegotiate(existingSession, newSdp) {
        return __awaiter(this, void 0, void 0, function* () {
            yield existingSession.peerConnection.setRemoteDescription({ sdp: newSdp, type: 'offer' });
            yield existingSession.accept();
        });
    }
    handleGenesysIceCandidate(iq) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = iq.genesysWebrtc;
            const params = message.params;
            const session = this.getSessionById(params.sessionId);
            yield session.addRemoteIceCandidate(params.sdp);
        });
    }
    handleGenesysTerminate(iq) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = iq.genesysWebrtc;
            const params = message.params;
            const session = this.getSessionById(params.sessionId);
            session.onSessionTerminate(params.reason);
        });
    }
    getSessionById(id) {
        const session = this.getAllSessions().find(session => session.id === id);
        if (!session) {
            const error = new Error('Failed to find session by id');
            this.logger.error(error, { sessionId: id });
            throw error;
        }
        return session;
    }
    sendIq(iq) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.stanzaInstance) {
                throw new Error('Failed to send iq because there was no stanza instance');
            }
            return this.stanzaInstance.sendIQ(iq);
        });
    }
    handleMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (msg.propose) {
                yield this.handlePropose(msg);
            }
            else if (msg.retract) {
                this.handleRetract(msg.retract.sessionId);
            }
            else if (msg.accept) {
                this.handledIncomingRtcSession(msg.accept.sessionId, msg);
            }
            else if (msg.reject) {
                this.handledIncomingRtcSession(msg.reject.sessionId, msg);
            }
        });
    }
    handleGenesysWebrtcStanza(iq) {
        return __awaiter(this, void 0, void 0, function* () {
            const webrtcInfo = iq.genesysWebrtc;
            if (webrtcInfo.method === 'offer') {
                return this.handleGenesysOffer(iq);
            }
            else if (webrtcInfo.method === 'iceCandidate') {
                return this.handleGenesysIceCandidate(iq);
            }
            else if (webrtcInfo.method === 'terminate') {
                return this.handleGenesysTerminate(iq);
            }
        });
    }
    prepareSession(options) {
        const pendingSession = this.pendingSessions[options.sid];
        // TODO: when we can safely remove the jingle session handling, this pending session
        // will need to be deleted in the `handleGenesysOffer` fn.
        if (pendingSession) {
            delete this.pendingSessions[pendingSession.sessionId];
        }
        if (pendingSession === null || pendingSession === void 0 ? void 0 : pendingSession.sdpOverXmpp) {
            this.logger.debug('skipping creation of jingle webrtc session due to sdpOverXmpp on the pendingSession');
            return;
        }
        const ignoreHostCandidatesForForceTurnFF = this.getIceTransportPolicy() === 'relay' && isFirefox;
        const gcSessionOpts = {
            options,
            logger: this.logger,
            id: options.sid,
            fromJid: options.peerID,
            peerID: options.peerID,
            optOutOfWebrtcStatsTelemetry: !!this.config.optOutOfWebrtcStatsTelemetry,
            conversationId: pendingSession === null || pendingSession === void 0 ? void 0 : pendingSession.conversationId,
            fromUserId: pendingSession === null || pendingSession === void 0 ? void 0 : pendingSession.fromJid,
            originalRoomJid: pendingSession === null || pendingSession === void 0 ? void 0 : pendingSession.originalRoomJid,
            sessionType: pendingSession === null || pendingSession === void 0 ? void 0 : pendingSession.sessionType,
            allowIPv6: this.config.allowIPv6,
            ignoreHostCandidatesFromRemote: ignoreHostCandidatesForForceTurnFF,
            meetingId: pendingSession === null || pendingSession === void 0 ? void 0 : pendingSession.meetingId
        };
        const session = new StanzaMediaSession(gcSessionOpts);
        this.proxyStatsForSession(session);
        return session;
    }
    // This should probably go into the webrtc sdk, but for now I'm putting here so it's in a central location.
    // This should be moved when the sdk is the primary consumer
    proxyStatsForSession(session) {
        session.on('stats', (statsEvent) => {
            const statsCopy = JSON.parse(JSON.stringify(statsEvent));
            const extraDetails = {
                conversationId: session.conversationId,
                sessionId: session.id,
                sessionType: session.sessionType
            };
            // format the event to what the api expects
            const event = formatStatsEvent(statsCopy, extraDetails);
            this.addStatToQueue(event);
        });
    }
    // this fn checks to see if the new stat fits inside the buffer. If not, send the queue;
    addStatToQueue(stat) {
        if (this.config.optOutOfWebrtcStatsTelemetry) {
            return;
        }
        if (!stat.details._appId) {
            stat.details._appId = this.logger.clientId;
            stat.details._appName = 'streamingclient';
            stat.details._appVersion = Client.version;
        }
        stat.details._originAppId = this.client.config.appId;
        // nr only accepts single level objects so we must flatten everything just in case
        const flattenedDetails = deepFlatten(stat.details);
        // new relic doesn't accept booleans so we convert them to strings
        Object.keys(flattenedDetails).forEach((key) => {
            const val = flattenedDetails[key];
            if (typeof val === 'boolean') {
                flattenedDetails[key] = `${val}`;
            }
        });
        const formattedStat = Object.assign(Object.assign({}, stat), { details: flattenedDetails });
        const currentEventSize = calculatePayloadSize(formattedStat);
        // Check if the size of the current event plus the size of the previous stats exceeds max size.
        const exceedsMaxStatSize = this.statBuffer + currentEventSize > this.currentMaxStatSize;
        this.statsArr.push(formattedStat);
        this.statBuffer += currentEventSize;
        // If it exceeds max size, don't append just send current payload.
        if (exceedsMaxStatSize) {
            this.sendStatsImmediately();
        }
        else {
            this.throttledSendStats();
        }
    }
    getLogDetailsForPendingSessionId(sessionId) {
        const logDetails = {
            sessionId
        };
        const pendingSession = this.pendingSessions[sessionId];
        if (pendingSession) {
            logDetails.sessionType = pendingSession.sessionType;
            logDetails.conversationId = pendingSession.conversationId;
        }
        return logDetails;
    }
    sendStatsImmediately() {
        // `throttledSendStats` needs to have a scheduled exeuction for `flush` to invoke the throttled function
        this.throttledSendStats();
        this.throttledSendStats.flush();
    }
    sendStats() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!navigator.onLine) {
                return;
            }
            const statsToSend = [];
            let currentSize = 0;
            for (const stats of this.statsArr) {
                const statSize = calculatePayloadSize(stats);
                if (currentSize + statSize < this.currentMaxStatSize) {
                    statsToSend.push(stats);
                    currentSize += statSize;
                }
                else {
                    break;
                }
            }
            this.statsArr.splice(0, statsToSend.length);
            this.statBuffer = this.statsArr.reduce((currentSize, stats) => currentSize + calculatePayloadSize(stats), 0);
            if (!statsToSend.length || this.client.isGuest) {
                return;
            }
            const data = {
                appName: 'streamingclient',
                appVersion: Client.version,
                originAppName: this.client.config.appName,
                originAppVersion: this.client.config.appVersion,
                actions: statsToSend
            };
            // At least for now, we'll just fire and forget. Since this is non-critical, we'll not retry failures
            try {
                let authToken = this.client.config.authToken;
                let url = 'diagnostics/newrelic/insights';
                if (this.client.backgroundAssistantMode) {
                    authToken = this.client.config.jwt;
                    url += '/backgroundassistant';
                }
                yield this.client.http.requestApi(url, {
                    method: 'post',
                    responseType: 'text',
                    host: this.client.config.apiHost,
                    authToken,
                    logger: this.client.logger,
                    data
                });
                this.currentMaxStatSize = desiredMaxStatsSize;
            }
            catch (err) {
                // re-add the stats to the buffer
                if (HttpClient.retryStatusCodes.has((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) || !navigator.onLine) {
                    this.statsArr = [...statsToSend, ...this.statsArr];
                    this.statBuffer = this.statsArr.reduce((currentSize, stats) => currentSize + calculatePayloadSize(stats), 0);
                }
                if (((_b = err.response) === null || _b === void 0 ? void 0 : _b.status) === 413) {
                    const attemptedPayloadSize = this.currentMaxStatSize;
                    this.currentMaxStatSize -= this.statsSizeDecreaseAmount;
                    this.logger.info('Failed to send stats due to 413, retrying with smaller set', { attemptedPayloadSize, newPayloadSize: this.currentMaxStatSize });
                    yield this.sendStats();
                }
                else {
                    this.logger.error('Failed to send stats', {
                        err,
                        numberOfFailedStats: statsToSend.length
                    }, { skipServer: !navigator.onLine });
                }
            }
        });
    }
    addEventListeners() {
        this.client.on('connected', () => {
            if (this.refreshIceServersTimer) {
                clearInterval(this.refreshIceServersTimer);
                this.refreshIceServersTimer = null;
            }
            this.refreshIceServersTimer = setInterval(this.refreshIceServers.bind(this), ICE_SERVER_REFRESH_PERIOD);
            return this.refreshIceServers()
                .catch((error) => this.logger.error('Error fetching ice servers after streaming-client connected', {
                error,
                channelId: this.client.config.channelId
            }));
        });
        this.client.on('disconnected', () => {
            clearInterval(this.refreshIceServersTimer);
            this.refreshIceServersTimer = null;
        });
    }
    /**
     * Stanza Handlers
     */
    handlePropose(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (msg.from === this.jid) {
                return;
            }
            const sessionId = msg.propose.sessionId;
            let sessionInfo = this.pendingSessions[sessionId];
            const isDuplicatePropose = !!sessionInfo;
            const sessionType = this.getSessionTypeByJid(msg.from);
            const loggingParams = { sessionId: sessionId, conversationId: msg.propose.conversationId, sessionType, isDuplicatePropose };
            this.logger.info('propose received', loggingParams);
            if (!isDuplicatePropose) {
                const { appId } = this.client.config;
                const proposeStat = {
                    actionName: 'WebrtcStats',
                    details: {
                        _eventTimestamp: new Date().getTime(),
                        _eventType: 'firstPropose',
                        conversationId: loggingParams.conversationId,
                        sdpViaXmppRequested: !!msg.propose.sdpOverXmpp,
                        sessionId: sessionId,
                        sessionType: sessionType,
                    }
                };
                this.addStatToQueue(proposeStat);
                // TODO: is ofrom used?
                // const roomJid = (msg.ofrom && msg.ofrom.full) || msg.from.full || msg.from;
                const fromJid = msg.from;
                const roomJid = fromJid;
                msg.propose.originalRoomJid = msg.propose.originalRoomJid || roomJid;
                sessionInfo = Object.assign(Object.assign({}, msg.propose), { toJid: msg.to, fromJid,
                    sessionType,
                    roomJid, id: sessionId, sdpOverXmpp: msg.propose.sdpOverXmpp, privAnswerMode: msg.propose.privAnswerMode });
                this.pendingSessions[sessionId] = sessionInfo;
            }
            if (sessionInfo.accepted) {
                this.logger.info('proceed already sent for this session, but sending another', loggingParams);
                yield this.acceptRtcSession(sessionId);
                return;
            }
            this.emit(events.REQUEST_INCOMING_RTCSESSION, Object.assign(sessionInfo));
        });
    }
    handleRetract(sessionId) {
        this.logger.info('retract received', this.getLogDetailsForPendingSessionId(sessionId));
        delete this.pendingSessions[sessionId];
        return this.emit(events.CANCEL_INCOMING_RTCSESSION, sessionId);
    }
    /**
     * Inform the client that another client has already taken care of the pendingSession
     */
    handledIncomingRtcSession(sessionId, msg) {
        let acceptedOrRejected = msg.accept ? 'accept' : 'reject';
        this.logger.info(`${acceptedOrRejected} received`, this.getLogDetailsForPendingSessionId(sessionId));
        return this.emit(events.HANDLED_INCOMING_RTCSESSION, sessionId);
    }
    /**
     * Exposed Api
     */
    initiateRtcSession(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            // send media presence to join conference or screen screenRecording
            // or send propose to single client for 1:1 video chat
            const session = {
                to: opts.jid,
                propose: {
                    id: v4(),
                    descriptions: []
                }
            };
            if (opts.stream) {
                for (let track of Array.from(opts.stream.getTracks())) {
                    session.propose.descriptions.push({ media: track.kind });
                }
            }
            if (opts.provideVideo) {
                const videoDescriptionAlreadyExists = session.propose.descriptions.filter((desciption) => desciption.media === 'video').length > 0;
                if (!videoDescriptionAlreadyExists) {
                    session.propose.descriptions.push({ media: 'video' });
                }
            }
            if (opts.provideAudio) {
                const audioDescriptionAlreadyExists = session.propose.descriptions.filter((desciption) => desciption.media === 'audio').length > 0;
                if (!audioDescriptionAlreadyExists) {
                    session.propose.descriptions.push({ media: 'audio' });
                }
            }
            if (opts.mediaPurpose) {
                session.propose.descriptions.push({ media: opts.mediaPurpose });
            }
            if (opts.jid && opts.jid.match(/@conference/)) {
                let mediaDescriptions = session.propose.descriptions;
                if (mediaDescriptions.length === 0) {
                    mediaDescriptions = [{ media: 'listener' }];
                }
                const mediaPresence = {
                    type: 'upgradeMedia',
                    to: opts.jid,
                    id: v4(),
                    from: this.jid,
                    media: {
                        conversationId: opts.conversationId,
                        sourceCommunicationId: opts.sourceCommunicationId
                    }
                };
                // TODO? can't set last-n on parent element because it invalidates presence root schema
                for (const mediaDescription of mediaDescriptions) {
                    mediaPresence.media[mediaDescription.media] = true;
                }
                yield this.stanzaInstance.send('presence', mediaPresence);
            }
            else {
                yield this.stanzaInstance.send('message', session); // send as Message
                this.pendingSessions[session.propose.id] = session;
            }
            return session.propose.id;
        });
    }
    // jingle proceed
    acceptRtcSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.pendingSessions[sessionId];
            if (!session) {
                this.emit(events.RTCSESSION_ERROR, 'Cannot accept session because it is not pending or does not exist');
                return;
            }
            const proceed = {
                to: session.fromJid,
                proceed: {
                    sessionId
                }
            };
            session.accepted = true;
            const details = this.getLogDetailsForPendingSessionId(sessionId);
            this.logger.info('sending jingle proceed', details);
            yield this.stanzaInstance.send('message', proceed); // send as Message
            this.logger.info('sent jingle proceed', details);
        });
    }
    rejectRtcSession(sessionId, ignore = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const logDetails = this.getLogDetailsForPendingSessionId(sessionId);
            const session = this.pendingSessions[sessionId];
            if (!session) {
                this.emit(events.RTCSESSION_ERROR, 'Cannot reject session because it is not pending or does not exist');
                return;
            }
            delete this.pendingSessions[sessionId];
            if (ignore) {
                this.ignoredSessions.set(sessionId, true);
            }
            else {
                const reject1 = {
                    to: toBare(this.jid),
                    reject: {
                        sessionId
                    }
                };
                const firstMessage = this.stanzaInstance.send('message', reject1); // send as Message
                const reject2 = {
                    to: session.fromJid,
                    reject: {
                        sessionId
                    }
                };
                const secondMessage = this.stanzaInstance.send('message', reject2); // send as Message
                this.logger.info('sending jingle reject', logDetails);
                yield Promise.all([firstMessage, secondMessage]);
                this.logger.info('sent jingle reject', logDetails);
            }
        });
    }
    rtcSessionAccepted(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const pendingSession = this.pendingSessions[sessionId];
            const logDetails = this.getLogDetailsForPendingSessionId(sessionId);
            const accept = {
                to: toBare(this.jid),
                accept: {
                    sessionId
                }
            };
            this.logger.info('sending session-info:accept', logDetails);
            yield this.stanzaInstance.send('message', accept); // send as Message
            this.logger.info('sent session-info:accept', logDetails);
        });
    }
    notifyScreenShareStart(session) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stanzaInstance.send('iq', {
                to: `${session.peerID}`,
                from: this.jid,
                type: 'set',
                jingle: {
                    action: JingleAction.SessionInfo,
                    sid: session.id,
                    screenstart: {}
                }
            });
        });
    }
    notifyScreenShareStop(session) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.stanzaInstance.send('iq', {
                to: `${session.peerID}`,
                from: this.jid,
                type: 'set',
                jingle: {
                    action: JingleAction.SessionInfo,
                    sid: session.id,
                    screenstop: {}
                }
            });
        });
    }
    cancelRtcSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = this.pendingSessions[sessionId];
            const logDetails = this.getLogDetailsForPendingSessionId(sessionId);
            if (!session) {
                this.emit(events.RTCSESSION_ERROR, 'Cannot cancel session because it is not pending or does not exist');
                return;
            }
            const retract = {
                to: session.toJid,
                retract: {
                    sessionId
                }
            };
            delete this.pendingSessions[sessionId];
            this.logger.info('sending jingle retract', logDetails);
            yield this.stanzaInstance.send('message', retract); // send as Message
            this.logger.info('sent jingle retract', logDetails);
        });
    }
    refreshIceServers() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.refreshIceServersRetryPromise) {
                this.refreshIceServersRetryPromise = retryPromise(this._refreshIceServers.bind(this, this.stanzaInstance), (error) => {
                    if (++this.discoRetries > MAX_DISCO_RETRIES) {
                        this.logger.warn('fetching ice servers failed. max retries reached.', {
                            retryAttempt: this.discoRetries,
                            MAX_DISCO_RETRIES,
                            error,
                            channelId: this.client.config.channelId
                        });
                        return false;
                    }
                    this.logger.warn('fetching ice servers failed. retrying', {
                        retryAttempt: this.discoRetries,
                        error,
                        channelId: this.client.config.channelId
                    });
                    return true;
                }, 0, this.client.logger);
            }
            return this.refreshIceServersRetryPromise.promise
                .finally(() => {
                this.discoRetries = 0;
                this.refreshIceServersRetryPromise = undefined;
            });
        });
    }
    _refreshIceServers(stanzaInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!stanzaInstance) {
                throw new Error('No stanza instance to refresh ice servers');
            }
            const server = stanzaInstance.config.server;
            const turnServersPromise = stanzaInstance.getServices(server, 'turn', '1');
            const stunServersPromise = stanzaInstance.getServices(server, 'stun', '1');
            const servicesPromise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject(new Error('Timeout waiting for refresh ice servers to finish'));
                }, ICE_SERVER_TIMEOUT);
                Promise.all([
                    turnServersPromise,
                    stunServersPromise
                ])
                    .then(([turn, stun]) => {
                    resolve([turn, stun]);
                })
                    .catch(reject);
            });
            const [turnServers, stunServers] = yield servicesPromise;
            const iceServers = [
                ...turnServers.services,
                ...stunServers.services
            ].map((service) => {
                const port = service.port ? `:${service.port}` : '';
                const ice = {
                    type: service.type,
                    urls: `${service.type}:${service.host}${port}`
                };
                if (['turn', 'turns'].includes(service.type)) {
                    if (service.transport && service.transport !== 'udp') {
                        ice.urls += `?transport=${service.transport}`;
                    }
                    if (service.username) {
                        ice.username = service.username;
                    }
                    if (service.password) {
                        ice.credential = service.password;
                    }
                }
                return ice;
            });
            this.setIceServers(iceServers, stanzaInstance);
            if (!stunServers.services.length) {
                this.logger.info('No stun servers received, setting iceTransportPolicy to "relay"');
                this.setIceTransportPolicy('relay', stanzaInstance);
            }
            else {
                this.setIceTransportPolicy('all', stanzaInstance);
            }
            return iceServers;
        });
    }
    setIceServers(iceServers, stanzaInstance) {
        stanzaInstance.jingle.iceServers = iceServers;
        this.iceServers = iceServers;
    }
    getIceTransportPolicy() {
        var _a;
        return (_a = this.stanzaInstance) === null || _a === void 0 ? void 0 : _a.jingle.config.peerConnectionConfig.iceTransportPolicy;
    }
    setIceTransportPolicy(policy, stanzaInstance) {
        stanzaInstance.jingle.config.peerConnectionConfig.iceTransportPolicy = policy;
    }
    getSessionTypeByJid(jid) {
        if (isAcdJid(jid)) {
            return SessionTypes.acdScreenShare;
        }
        else if (isScreenRecordingJid(jid)) {
            return SessionTypes.screenRecording;
        }
        else if (isSoftphoneJid(jid)) {
            return SessionTypes.softphone;
        }
        else if (isVideoJid(jid)) {
            return SessionTypes.collaborateVideo;
        }
        else {
            return SessionTypes.unknown;
        }
    }
    getSessionManager() {
        var _a;
        return (_a = this.stanzaInstance) === null || _a === void 0 ? void 0 : _a.jingle;
    }
    getAllSessions() {
        var _a;
        const stanzaSessionsObj = (_a = this.stanzaInstance) === null || _a === void 0 ? void 0 : _a.jingle.sessions;
        const stanzaSessions = stanzaSessionsObj && Object.values(stanzaSessionsObj) || [];
        return [...stanzaSessions, ...this.webrtcSessions];
    }
    proxyNRStat(stat) {
        this.addStatToQueue(stat);
    }
    get expose() {
        return {
            on: this.on.bind(this),
            once: this.once.bind(this),
            off: this.off.bind(this),
            removeAllListeners: this.removeAllListeners.bind(this),
            removeListener: this.removeListener.bind(this),
            refreshIceServers: this.refreshIceServers.bind(this),
            acceptRtcSession: this.acceptRtcSession.bind(this),
            rejectRtcSession: this.rejectRtcSession.bind(this),
            cancelRtcSession: this.cancelRtcSession.bind(this),
            notifyScreenShareStart: this.notifyScreenShareStart.bind(this),
            notifyScreenShareStop: this.notifyScreenShareStop.bind(this),
            rtcSessionAccepted: this.rtcSessionAccepted.bind(this),
            initiateRtcSession: this.initiateRtcSession.bind(this),
            getSessionTypeByJid: this.getSessionTypeByJid.bind(this),
            getSessionManager: this.getSessionManager.bind(this),
            getAllSessions: this.getAllSessions.bind(this),
            proxyNRStat: this.proxyNRStat.bind(this)
        };
    }
}
