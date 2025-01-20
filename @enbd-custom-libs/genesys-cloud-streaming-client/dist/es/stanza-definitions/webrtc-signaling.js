import { attribute, booleanAttribute, childAttribute, childJSON } from 'stanza/jxt';
import { NS_CLIENT, NS_JINGLE_RTP_INFO_1 } from 'stanza/Namespaces';
const NS_JINGLE_SIGNALING = 'urn:xmpp:jingle-message:0';
const proposeDefinition = {
    aliases: ['message.propose'],
    element: 'propose',
    fields: {
        conversationId: attribute('inin-cid'),
        persistentConversationId: attribute('inin-persistent-cid'),
        sdpOverXmpp: booleanAttribute('inin-sdp-over-xmpp'),
        privAnswerMode: attribute('inin-priv-answer-mode'),
        originalRoomJid: attribute('inin-ofrom'),
        autoAnswer: booleanAttribute('inin-autoanswer'),
        fromUserId: attribute('inin-user-id'),
        sessionId: attribute('id'),
        meetingId: attribute('inin-meeting-id')
    },
    namespace: NS_JINGLE_SIGNALING
};
const proceedDefinition = {
    aliases: ['message.proceed'],
    element: 'proceed',
    fields: {
        sessionId: attribute('id')
    },
    namespace: NS_JINGLE_SIGNALING
};
const sessionAcceptedDefinition = {
    aliases: ['message.accept'],
    element: 'accept',
    fields: {
        sessionId: attribute('id')
    },
    namespace: NS_JINGLE_SIGNALING
};
const sessionRejectedDefinition = {
    aliases: ['message.reject'],
    element: 'reject',
    fields: {
        sessionId: attribute('id')
    },
    namespace: NS_JINGLE_SIGNALING
};
const sessionRetractedDefinition = {
    aliases: ['message.retract'],
    element: 'retract',
    fields: {
        sessionId: attribute('id')
    },
    namespace: NS_JINGLE_SIGNALING
};
const screenStartDefinition = {
    aliases: ['iq.jingle.screenstart'],
    element: 'screen-start',
    namespace: NS_JINGLE_RTP_INFO_1
};
const screenStopDefinition = {
    aliases: ['iq.jingle.screenstop'],
    element: 'screen-stop',
    namespace: NS_JINGLE_RTP_INFO_1
};
// this allows parsing xml that looks something like this:
/*
  <iq xmlns="jabber:client" [other stuff]>
    <genesys-webrtc xmlns="genesys">{ "id": "whatver", "anyOtherFieldICareAbout": true }</genesys-webrtc>
  </iq>
*/
const genesysWebrtc = {
    path: 'iq',
    namespace: NS_CLIENT,
    element: 'iq',
    fields: {
        genesysWebrtc: childJSON('genesys', 'genesys-webrtc')
    }
};
const mediaMessage = {
    path: 'message',
    namespace: NS_CLIENT,
    element: 'message',
    fields: {
        mediaMessage: childJSON('genesys', 'media-message')
    }
};
const upgradeMediaPresenceDefinition = {
    aliases: ['presence.media'],
    element: 'x',
    fields: {
        conversationId: attribute('conversationId'),
        sourceCommunicationId: attribute('sourceCommunicationId'),
        screenShare: childAttribute(null, 'mediastream', 'screenShare'),
        video: childAttribute(null, 'mediastream', 'video'),
        audio: childAttribute(null, 'mediastream', 'audio'),
        listener: childAttribute(null, 'mediastream', 'listener'),
        screenRecording: childAttribute(null, 'mediastream', 'screenRecording')
    },
    namespace: 'orgspan:mediastream'
};
export const definitions = [
    proposeDefinition,
    proceedDefinition,
    sessionAcceptedDefinition,
    sessionRejectedDefinition,
    sessionRetractedDefinition,
    screenStartDefinition,
    screenStopDefinition,
    upgradeMediaPresenceDefinition,
    genesysWebrtc,
    mediaMessage
];
