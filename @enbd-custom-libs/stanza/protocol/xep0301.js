"use strict";
// ====================================================================
// XEP-0301: In-Band Real Time Text
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0301.html
// Version: 1.0 (2013-10-082)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    {
        element: 'rtt',
        fields: {
            event: (0, jxt_1.attribute)('event', 'edit'),
            id: (0, jxt_1.attribute)('id'),
            seq: (0, jxt_1.integerAttribute)('seq')
        },
        namespace: Namespaces_1.NS_RTT_0,
        path: 'message.rtt'
    },
    {
        aliases: [{ path: 'message.rtt.actions', multiple: true }],
        element: 't',
        fields: {
            position: (0, jxt_1.integerAttribute)('p'),
            text: (0, jxt_1.text)()
        },
        namespace: Namespaces_1.NS_RTT_0,
        type: 'insert',
        typeField: 'type'
    },
    {
        aliases: [{ path: 'message.rtt.actions', multiple: true }],
        element: 'e',
        fields: {
            length: (0, jxt_1.integerAttribute)('n', 1),
            position: (0, jxt_1.integerAttribute)('p')
        },
        namespace: Namespaces_1.NS_RTT_0,
        type: 'erase',
        typeField: 'type'
    },
    {
        aliases: [{ multiple: true, path: 'message.rtt.actions' }],
        element: 'w',
        fields: {
            duration: (0, jxt_1.integerAttribute)('n', 0)
        },
        namespace: Namespaces_1.NS_RTT_0,
        type: 'wait',
        typeField: 'type'
    }
];
exports.default = Protocol;
