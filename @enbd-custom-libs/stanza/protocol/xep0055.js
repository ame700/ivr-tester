"use strict";
// ====================================================================
// XEP-0055: Jabber Search
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0055.html
// Version: 1.3 (2009-09-15)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.addAlias)(Namespaces_1.NS_DATAFORM, 'x', ['iq.search.form']),
    (0, jxt_1.addAlias)(Namespaces_1.NS_RSM, 'set', ['iq.search.paging']),
    {
        element: 'query',
        fields: {
            email: (0, jxt_1.childText)(null, 'email'),
            familyName: (0, jxt_1.childText)(null, 'last'),
            givenName: (0, jxt_1.childText)(null, 'first'),
            instructions: (0, jxt_1.childText)(null, 'instructions'),
            nick: (0, jxt_1.childText)(null, 'nick')
        },
        namespace: Namespaces_1.NS_SEARCH,
        path: 'iq.search'
    },
    {
        aliases: [{ path: 'iq.search.items', multiple: true }],
        element: 'item',
        fields: {
            email: (0, jxt_1.childText)(null, 'email'),
            familyName: (0, jxt_1.childText)(null, 'last'),
            givenName: (0, jxt_1.childText)(null, 'first'),
            jid: (0, jxt_1.JIDAttribute)('jid'),
            nick: (0, jxt_1.childText)(null, 'nick')
        },
        namespace: Namespaces_1.NS_SEARCH
    }
];
exports.default = Protocol;
