"use strict";
// ====================================================================
// RFC 6121: Extensible Messaging and Presence Protocol (XMPP):
//      Instant Messaging and Presence
// --------------------------------------------------------------------
// Source: https://tools.ietf.org/html/rfc6121
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.extendStreamFeatures)({
        rosterPreApproval: (0, jxt_1.childBoolean)(Namespaces_1.NS_SUBSCRIPTION_PREAPPROVAL, 'sub'),
        rosterVersioning: (0, jxt_1.childBoolean)(Namespaces_1.NS_ROSTER_VERSIONING, 'ver')
    }),
    (0, jxt_1.extendMessage)({
        alternateLanguageBodies: (0, jxt_1.childAlternateLanguageText)(null, 'body'),
        alternateLanguageSubjects: (0, jxt_1.childAlternateLanguageText)(null, 'subject'),
        body: (0, jxt_1.childText)(null, 'body'),
        hasSubject: (0, jxt_1.childBoolean)(null, 'subject'),
        parentThread: (0, jxt_1.childAttribute)(null, 'thread', 'parent'),
        subject: (0, jxt_1.childText)(null, 'subject'),
        thread: (0, jxt_1.childText)(null, 'thread'),
        type: (0, jxt_1.attribute)('type')
    }),
    (0, jxt_1.extendPresence)({
        alternateLanguageStatuses: (0, jxt_1.childAlternateLanguageText)(null, 'status'),
        priority: (0, jxt_1.childInteger)(null, 'priority', 0),
        show: (0, jxt_1.childText)(null, 'show'),
        status: (0, jxt_1.childText)(null, 'status'),
        type: (0, jxt_1.attribute)('type')
    }),
    {
        element: 'query',
        fields: {
            version: (0, jxt_1.attribute)('ver', undefined, { emitEmpty: true })
        },
        namespace: Namespaces_1.NS_ROSTER,
        path: 'iq.roster'
    },
    {
        aliases: [{ path: 'iq.roster.items', multiple: true }],
        element: 'item',
        fields: {
            groups: (0, jxt_1.multipleChildText)(null, 'group'),
            jid: (0, jxt_1.JIDAttribute)('jid'),
            name: (0, jxt_1.attribute)('name'),
            pending: (0, jxt_1.attribute)('ask'),
            preApproved: (0, jxt_1.booleanAttribute)('approved'),
            subscription: (0, jxt_1.attribute)('subscription')
        },
        namespace: Namespaces_1.NS_ROSTER
    }
];
exports.default = Protocol;
