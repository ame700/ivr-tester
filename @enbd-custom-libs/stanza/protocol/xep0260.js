"use strict";
// ====================================================================
// XEP-0260: Jingle SOCKS5 Bytestreams Transport Method
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0260.html
// Version: 1.0.1 (2016-05-17)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    {
        element: 'transport',
        fields: {
            activated: (0, jxt_1.childAttribute)(null, 'activated', 'cid'),
            address: (0, jxt_1.attribute)('dstaddr'),
            candidateError: (0, jxt_1.childBoolean)(null, 'candidate-error'),
            candidateUsed: (0, jxt_1.childAttribute)(null, 'candidate-used', 'cid'),
            mode: (0, jxt_1.attribute)('mode', 'tcp'),
            proxyError: (0, jxt_1.childBoolean)(null, 'proxy-error'),
            sid: (0, jxt_1.attribute)('sid')
        },
        namespace: Namespaces_1.NS_JINGLE_SOCKS5_1,
        path: 'iq.jingle.contents.transport',
        type: Namespaces_1.NS_JINGLE_SOCKS5_1,
        typeField: 'transportType'
    },
    {
        aliases: [
            {
                multiple: true,
                path: 'iq.jingle.contents.transport.candidates',
                selector: Namespaces_1.NS_JINGLE_SOCKS5_1
            }
        ],
        element: 'candidate',
        fields: {
            cid: (0, jxt_1.attribute)('cid'),
            host: (0, jxt_1.attribute)('host'),
            jid: (0, jxt_1.JIDAttribute)('jid'),
            port: (0, jxt_1.integerAttribute)('port'),
            priority: (0, jxt_1.integerAttribute)('priority'),
            type: (0, jxt_1.attribute)('type'),
            uri: (0, jxt_1.attribute)('uri')
        },
        namespace: Namespaces_1.NS_JINGLE_SOCKS5_1
    }
];
exports.default = Protocol;
