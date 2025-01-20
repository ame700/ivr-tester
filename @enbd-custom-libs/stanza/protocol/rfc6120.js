"use strict";
// ====================================================================
// RFC 6120: Extensible Messaging and Presence Protocol (XMPP): Core
// --------------------------------------------------------------------
// Source: https://tools.ietf.org/html/rfc6120
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const Constants_1 = require("../Constants");
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const _Stream = {
    defaultType: 'stream',
    element: 'stream',
    fields: {
        from: (0, jxt_1.attribute)('from'),
        id: (0, jxt_1.attribute)('id'),
        lang: (0, jxt_1.languageAttribute)(),
        to: (0, jxt_1.attribute)('to'),
        version: (0, jxt_1.attribute)('version')
    },
    namespace: Namespaces_1.NS_STREAM,
    path: 'stream',
    type: 'stream',
    typeField: 'action'
};
const _StreamFeatures = {
    element: 'features',
    namespace: Namespaces_1.NS_STREAM,
    path: 'features'
};
const _StreamError = {
    element: 'error',
    fields: {
        alternateLanguageText: (0, jxt_1.childAlternateLanguageText)(Namespaces_1.NS_STREAMS, 'text'),
        condition: (0, jxt_1.childEnum)(Namespaces_1.NS_STREAMS, Object.values(Constants_1.StreamErrorCondition), Constants_1.StreamErrorCondition.UndefinedCondition),
        seeOtherHost: (0, jxt_1.childText)(Namespaces_1.NS_STREAMS, Constants_1.StreamErrorCondition.SeeOtherHost),
        text: (0, jxt_1.childText)(Namespaces_1.NS_STREAMS, 'text')
    },
    namespace: Namespaces_1.NS_STREAM,
    path: 'streamError'
};
// --------------------------------------------------------------------
const _StanzaError = Object.values(Constants_1.StreamType).map(streamNS => ({
    aliases: ['stanzaError', 'message.error', 'presence.error', 'iq.error'],
    defaultType: Namespaces_1.NS_CLIENT,
    element: 'error',
    fields: {
        alternateLanguageText: (0, jxt_1.childAlternateLanguageText)(Namespaces_1.NS_STANZAS, 'text'),
        by: (0, jxt_1.JIDAttribute)('by'),
        condition: (0, jxt_1.childEnum)(Namespaces_1.NS_STANZAS, Object.values(Constants_1.StanzaErrorCondition), Constants_1.StanzaErrorCondition.UndefinedCondition),
        gone: (0, jxt_1.childText)(Namespaces_1.NS_STANZAS, Constants_1.StanzaErrorCondition.Gone),
        redirect: (0, jxt_1.childText)(Namespaces_1.NS_STANZAS, Constants_1.StanzaErrorCondition.Redirect),
        text: (0, jxt_1.childText)(Namespaces_1.NS_STANZAS, 'text'),
        type: (0, jxt_1.attribute)('type')
    },
    namespace: streamNS,
    type: streamNS,
    typeField: 'streamType'
}));
// --------------------------------------------------------------------
const baseIQFields = new Set([
    'from',
    'id',
    'lang',
    'to',
    'type',
    'payloadType',
    'error',
    'streamType'
]);
const _IQ = Object.values(Constants_1.StreamType).map((streamNS) => ({
    childrenExportOrder: {
        error: 200000
    },
    defaultType: Namespaces_1.NS_CLIENT,
    element: 'iq',
    fields: {
        from: (0, jxt_1.JIDAttribute)('from'),
        id: (0, jxt_1.attribute)('id'),
        lang: (0, jxt_1.languageAttribute)(),
        payloadType: {
            order: -10000,
            importer(xml, context) {
                if (context.data.type !== 'get' &&
                    context.data.type !== 'set') {
                    return;
                }
                const childCount = xml.children.filter(child => typeof child !== 'string')
                    .length;
                if (childCount !== 1) {
                    return 'invalid-payload-count';
                }
                const extensions = Object.keys(context.data).filter(key => !baseIQFields.has(key));
                if (extensions.length !== 1) {
                    return 'unknown-payload';
                }
                return extensions[0];
            }
        },
        to: (0, jxt_1.JIDAttribute)('to'),
        type: (0, jxt_1.attribute)('type')
    },
    namespace: streamNS,
    path: 'iq',
    type: streamNS,
    typeField: 'streamType'
}));
// --------------------------------------------------------------------
const _Message = Object.values(Constants_1.StreamType).map(streamNS => ({
    childrenExportOrder: {
        error: 200000
    },
    defaultType: Namespaces_1.NS_CLIENT,
    element: 'message',
    fields: {
        from: (0, jxt_1.JIDAttribute)('from'),
        id: (0, jxt_1.attribute)('id'),
        lang: (0, jxt_1.languageAttribute)(),
        to: (0, jxt_1.JIDAttribute)('to')
    },
    namespace: streamNS,
    path: 'message',
    type: streamNS,
    typeField: 'streamType'
}));
// --------------------------------------------------------------------
const _Presence = Object.values(Constants_1.StreamType).map(streamNS => ({
    childrenExportOrder: {
        error: 200000
    },
    defaultType: Namespaces_1.NS_CLIENT,
    element: 'presence',
    fields: {
        from: (0, jxt_1.JIDAttribute)('from'),
        id: (0, jxt_1.attribute)('id'),
        lang: (0, jxt_1.languageAttribute)(),
        to: (0, jxt_1.JIDAttribute)('to')
    },
    namespace: streamNS,
    path: 'presence',
    type: streamNS,
    typeField: 'streamType'
}));
// --------------------------------------------------------------------
const _SASL = [
    {
        element: 'mechanisms',
        fields: {
            mechanisms: (0, jxt_1.multipleChildText)(null, 'mechanism')
        },
        namespace: Namespaces_1.NS_SASL,
        path: 'features.sasl'
    },
    {
        element: 'abort',
        namespace: Namespaces_1.NS_SASL,
        path: 'sasl',
        type: 'abort',
        typeField: 'type'
    },
    {
        element: 'auth',
        fields: {
            mechanism: (0, jxt_1.attribute)('mechanism'),
            value: (0, jxt_1.textBuffer)('base64')
        },
        namespace: Namespaces_1.NS_SASL,
        path: 'sasl',
        type: 'auth',
        typeField: 'type'
    },
    {
        element: 'challenge',
        fields: {
            value: (0, jxt_1.textBuffer)('base64')
        },
        namespace: Namespaces_1.NS_SASL,
        path: 'sasl',
        type: 'challenge',
        typeField: 'type'
    },
    {
        element: 'response',
        fields: {
            value: (0, jxt_1.textBuffer)('base64')
        },
        namespace: Namespaces_1.NS_SASL,
        path: 'sasl',
        type: 'response',
        typeField: 'type'
    },
    {
        element: 'success',
        fields: {
            value: (0, jxt_1.textBuffer)('base64')
        },
        namespace: Namespaces_1.NS_SASL,
        path: 'sasl',
        type: 'success',
        typeField: 'type'
    },
    {
        element: 'failure',
        fields: {
            alternateLanguageText: (0, jxt_1.childAlternateLanguageText)(Namespaces_1.NS_SASL, 'text'),
            condition: (0, jxt_1.childEnum)(Namespaces_1.NS_SASL, Object.values(Constants_1.SASLFailureCondition)),
            text: (0, jxt_1.childText)(Namespaces_1.NS_SASL, 'text')
        },
        namespace: Namespaces_1.NS_SASL,
        path: 'sasl',
        type: 'failure',
        typeField: 'type'
    }
];
// --------------------------------------------------------------------
const _STARTTLS = [
    {
        aliases: ['features.tls'],
        defaultType: 'start',
        element: 'starttls',
        fields: {
            required: (0, jxt_1.childBoolean)(null, 'required')
        },
        namespace: Namespaces_1.NS_STARTTLS,
        path: 'tls',
        type: 'start',
        typeField: 'type'
    },
    {
        element: 'proceed',
        namespace: Namespaces_1.NS_STARTTLS,
        path: 'tls',
        type: 'proceed',
        typeField: 'type'
    },
    {
        element: 'failure',
        namespace: Namespaces_1.NS_STARTTLS,
        path: 'tls',
        type: 'failure',
        typeField: 'type'
    }
];
// --------------------------------------------------------------------
const _Bind = {
    aliases: ['features.bind', 'iq.bind'],
    element: 'bind',
    fields: {
        jid: (0, jxt_1.childText)(null, 'jid'),
        resource: (0, jxt_1.childText)(null, 'resource')
    },
    namespace: Namespaces_1.NS_BIND
};
// --------------------------------------------------------------------
const Protocol = [
    _Stream,
    _StreamFeatures,
    _StreamError,
    ..._StanzaError,
    ..._SASL,
    ..._STARTTLS,
    ..._IQ,
    ..._Message,
    ..._Presence,
    _Bind
];
exports.default = Protocol;
