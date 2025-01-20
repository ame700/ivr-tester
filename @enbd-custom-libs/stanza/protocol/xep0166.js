"use strict";
// ====================================================================
// XEP-0166: Jingle
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0166.html
// Version: 1.1.1 (2016-05-17)
//
// Additional:
// - Added unknown-content error
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const Constants_1 = require("../Constants");
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.extendStanzaError)({
        jingleError: (0, jxt_1.childEnum)(Namespaces_1.NS_JINGLE_ERRORS_1, Object.values(Constants_1.JingleErrorCondition))
    }),
    {
        element: 'jingle',
        fields: {
            action: (0, jxt_1.attribute)('action'),
            initiator: (0, jxt_1.JIDAttribute)('initiator'),
            responder: (0, jxt_1.JIDAttribute)('responder'),
            sid: (0, jxt_1.attribute)('sid')
        },
        namespace: Namespaces_1.NS_JINGLE_1,
        path: 'iq.jingle'
    },
    {
        aliases: [
            {
                multiple: true,
                path: 'iq.jingle.contents'
            }
        ],
        element: 'content',
        fields: {
            creator: (0, jxt_1.attribute)('creator'),
            disposition: (0, jxt_1.attribute)('disposition', 'session'),
            name: (0, jxt_1.attribute)('name'),
            senders: (0, jxt_1.attribute)('senders', 'both')
        },
        namespace: Namespaces_1.NS_JINGLE_1
    },
    {
        element: 'reason',
        fields: {
            alternativeSession: (0, jxt_1.childText)(null, 'alternative-session'),
            condition: (0, jxt_1.childEnum)(null, Object.values(Constants_1.JingleReasonCondition)),
            text: (0, jxt_1.childText)(null, 'text')
        },
        namespace: Namespaces_1.NS_JINGLE_1,
        path: 'iq.jingle.reason'
    }
];
exports.default = Protocol;
