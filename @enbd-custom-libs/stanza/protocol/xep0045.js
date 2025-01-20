"use strict";
// ====================================================================
// XEP-0045: Multi-User Chat
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0045.html
// Version: 1.31.1 (2018-03-12)
//
// Additional:
// --------------------------------------------------------------------
// XEP-0249: Direct MUC Invitations
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0249.html
// Version: 1.2 (2011-09-22)
//
// --------------------------------------------------------------------
// XEP-0307: Unique Room Names for Multi-User Chat
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0307.html
// Version: 0.1 (2011-11-10)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.addAlias)(Namespaces_1.NS_DATAFORM, 'x', [{ path: 'iq.muc.form', selector: 'configure' }]),
    {
        defaultType: 'info',
        element: 'x',
        fields: {
            password: (0, jxt_1.childText)(null, 'password')
        },
        namespace: Namespaces_1.NS_MUC,
        path: 'presence.muc',
        type: 'join',
        typeField: 'type'
    },
    {
        aliases: [{ path: 'presence.muc.history', selector: 'join' }],
        element: 'history',
        fields: {
            maxCharacters: (0, jxt_1.integerAttribute)('maxchars'),
            maxStanzas: (0, jxt_1.integerAttribute)('maxstanzas'),
            seconds: (0, jxt_1.integerAttribute)('seconds'),
            since: (0, jxt_1.dateAttribute)('since')
        },
        namespace: Namespaces_1.NS_MUC
    },
    {
        aliases: ['presence.muc', 'message.muc'],
        defaultType: 'info',
        element: 'x',
        fields: {
            action: (0, jxt_1.childEnum)(null, ['invite', 'decline', 'destroy']),
            actor: (0, jxt_1.splicePath)(null, 'item', 'mucactor'),
            affiliation: (0, jxt_1.childAttribute)(null, 'item', 'affiliation'),
            jid: (0, jxt_1.childJIDAttribute)(null, 'item', 'jid'),
            nick: (0, jxt_1.childAttribute)(null, 'item', 'nick'),
            password: (0, jxt_1.childText)(null, 'password'),
            reason: (0, jxt_1.deepChildText)([
                { namespace: null, element: 'item' },
                { namespace: null, element: 'reason' }
            ]),
            role: (0, jxt_1.childAttribute)(null, 'item', 'role'),
            statusCodes: (0, jxt_1.multipleChildAttribute)(null, 'status', 'code')
        },
        namespace: Namespaces_1.NS_MUC_USER,
        type: 'info',
        typeField: 'type',
        typeOrder: 1
    },
    {
        element: 'actor',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            nick: (0, jxt_1.attribute)('nick')
        },
        namespace: Namespaces_1.NS_MUC_USER,
        path: 'mucactor'
    },
    {
        element: 'destroy',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            password: (0, jxt_1.childText)(null, 'password'),
            reason: (0, jxt_1.childText)(null, 'reason')
        },
        namespace: Namespaces_1.NS_MUC_USER,
        path: 'presence.muc.destroy'
    },
    {
        aliases: [{ path: 'message.muc.invite', multiple: true }],
        element: 'invite',
        fields: {
            continue: (0, jxt_1.childBoolean)(null, 'continue'),
            from: (0, jxt_1.JIDAttribute)('from'),
            reason: (0, jxt_1.childText)(null, 'reason'),
            thread: (0, jxt_1.childAttribute)(null, 'continue', 'thread'),
            to: (0, jxt_1.JIDAttribute)('to')
        },
        namespace: Namespaces_1.NS_MUC_USER
    },
    {
        element: 'decline',
        fields: {
            from: (0, jxt_1.JIDAttribute)('from'),
            reason: (0, jxt_1.childText)(null, 'reason'),
            to: (0, jxt_1.JIDAttribute)('to')
        },
        namespace: Namespaces_1.NS_MUC_USER,
        path: 'message.muc',
        type: 'decline'
    },
    {
        element: 'query',
        namespace: Namespaces_1.NS_MUC_ADMIN,
        path: 'iq.muc',
        type: 'user-list',
        typeField: 'type'
    },
    {
        aliases: [{ path: 'iq.muc.users', multiple: true, selector: 'user-list' }],
        element: 'item',
        fields: {
            affiliation: (0, jxt_1.attribute)('affiliation'),
            jid: (0, jxt_1.JIDAttribute)('jid'),
            nick: (0, jxt_1.attribute)('nick'),
            reason: (0, jxt_1.childText)(null, 'reason'),
            role: (0, jxt_1.attribute)('role')
        },
        namespace: Namespaces_1.NS_MUC_ADMIN
    },
    {
        aliases: ['iq.muc.users.actor'],
        element: 'actor',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            nick: (0, jxt_1.attribute)('nick')
        },
        namespace: Namespaces_1.NS_MUC_ADMIN
    },
    {
        element: 'query',
        namespace: Namespaces_1.NS_MUC_OWNER,
        path: 'iq.muc',
        type: 'configure',
        typeField: 'type'
    },
    {
        aliases: [{ path: 'iq.muc.destroy', selector: 'configure' }],
        element: 'destroy',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            password: (0, jxt_1.childText)(null, 'password'),
            reason: (0, jxt_1.childText)(null, 'reason')
        },
        namespace: Namespaces_1.NS_MUC_OWNER
    },
    // XEP-0249
    {
        element: 'x',
        fields: {
            action: (0, jxt_1.staticValue)('invite'),
            continue: (0, jxt_1.booleanAttribute)('continue'),
            jid: (0, jxt_1.JIDAttribute)('jid'),
            legacyReason: (0, jxt_1.text)(),
            password: (0, jxt_1.attribute)('password'),
            reason: (0, jxt_1.attribute)('reason'),
            thread: (0, jxt_1.attribute)('thread')
        },
        namespace: Namespaces_1.NS_MUC_DIRECT_INVITE,
        path: 'message.muc',
        type: 'direct-invite',
        typeOrder: 2
    },
    // XEP-0307
    {
        element: 'unique',
        fields: {
            name: (0, jxt_1.text)()
        },
        namespace: Namespaces_1.NS_MUC_UNIQUE,
        path: 'iq.muc',
        type: 'unique'
    },
    (0, jxt_1.extendMessage)({
        legacyMUC: {
            exporter(xml, value, context) {
                const out = context.registry
                    ? context.registry.export('message.muc', { ...value, type: 'direct-invite' })
                    : undefined;
                if (out) {
                    xml.appendChild(out);
                }
            },
            exportOrder: 100001,
            importer(xml, context) {
                const mucElement = (0, jxt_1.findAll)(xml, Namespaces_1.NS_MUC_USER, 'x')[0];
                if (!mucElement) {
                    return;
                }
                const confElement = (0, jxt_1.findAll)(xml, Namespaces_1.NS_MUC_DIRECT_INVITE, 'x')[0];
                if (!confElement) {
                    return;
                }
                return context.registry
                    ? context.registry.import(confElement, {
                        ...context,
                        path: 'message'
                    })
                    : undefined;
            },
            importOrder: -1
        }
    })
];
exports.default = Protocol;
