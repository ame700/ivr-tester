"use strict";
// ====================================================================
// XEP-0357: Push Notifications
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0357.html
// Version: 0.3 (2017-08-24)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.addAlias)(Namespaces_1.NS_DATAFORM, 'x', ['iq.push.form', 'pushNotification.form']),
    {
        element: 'enable',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node')
        },
        namespace: Namespaces_1.NS_PUSH_0,
        path: 'iq.push',
        type: 'enable',
        typeField: 'action'
    },
    {
        element: 'disable',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node')
        },
        namespace: Namespaces_1.NS_PUSH_0,
        path: 'iq.push',
        type: 'disable',
        typeField: 'action'
    },
    {
        aliases: (0, jxt_1.pubsubItemContentAliases)(),
        element: 'notification',
        namespace: Namespaces_1.NS_PUSH_0,
        path: 'pushNotification',
        type: Namespaces_1.NS_PUSH_0,
        typeField: 'itemType'
    }
];
exports.default = Protocol;
