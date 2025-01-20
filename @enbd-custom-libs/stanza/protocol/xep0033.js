"use strict";
// ====================================================================
// XEP-0033: Extended Stanza Addressing
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0033.html
// Version:	1.2.1 (2017-01-11)
// --------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.extendMessage)({
        addresses: (0, jxt_1.splicePath)(Namespaces_1.NS_ADDRESS, 'addresses', 'extendedAddress', true)
    }),
    (0, jxt_1.extendPresence)({
        addresses: (0, jxt_1.splicePath)(Namespaces_1.NS_ADDRESS, 'addresses', 'extendedAddress', true)
    }),
    {
        element: 'address',
        fields: {
            alternateLanguageDescriptions: (0, jxt_1.childAlternateLanguageText)(null, 'desc'),
            delivered: (0, jxt_1.booleanAttribute)('delivered'),
            description: (0, jxt_1.attribute)('desc'),
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node'),
            type: (0, jxt_1.attribute)('type'),
            uri: (0, jxt_1.attribute)('uri')
        },
        namespace: Namespaces_1.NS_ADDRESS,
        path: 'extendedAddress'
    }
];
exports.default = Protocol;
