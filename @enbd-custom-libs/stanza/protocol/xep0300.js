"use strict";
// ====================================================================
// XEP-0300: Use of Cryptographic Hash Functions in XMPP
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0300.html
// Version: 0.5.3 (2018-02-14)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    {
        defaultType: '2',
        element: 'hash',
        fields: {
            algorithm: (0, jxt_1.attribute)('algo'),
            value: (0, jxt_1.textBuffer)('base64'),
            version: (0, jxt_1.staticValue)('2')
        },
        namespace: Namespaces_1.NS_HASHES_2,
        path: 'hash',
        type: '2',
        typeField: 'version'
    },
    {
        element: 'hash-used',
        fields: {
            algorithm: (0, jxt_1.attribute)('algo'),
            version: (0, jxt_1.staticValue)('2')
        },
        namespace: Namespaces_1.NS_HASHES_2,
        path: 'hashUsed'
    },
    {
        element: 'hash',
        fields: {
            algorithm: (0, jxt_1.attribute)('algo'),
            value: (0, jxt_1.textBuffer)('hex'),
            version: (0, jxt_1.staticValue)('1')
        },
        namespace: Namespaces_1.NS_HASHES_1,
        path: 'hash',
        type: '1',
        typeField: 'version'
    }
];
exports.default = Protocol;
