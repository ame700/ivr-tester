"use strict";
// ====================================================================
// XEP-0384: OMEMO Encryption
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0384.html
// Version: 0.3.0 (2018-07-31)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    {
        aliases: ['message.omemo'],
        element: 'encrypted',
        fields: {
            payload: (0, jxt_1.childTextBuffer)(null, 'payload', 'base64')
        },
        namespace: Namespaces_1.NS_OMEMO_AXOLOTL,
        path: 'omemo'
    },
    {
        element: 'header',
        fields: {
            iv: (0, jxt_1.childTextBuffer)(null, 'iv', 'base64'),
            sid: (0, jxt_1.integerAttribute)('sid')
        },
        namespace: Namespaces_1.NS_OMEMO_AXOLOTL,
        path: 'omemo.header'
    },
    {
        aliases: [{ path: 'omemo.header.keys', multiple: true }],
        element: 'key',
        fields: {
            preKey: (0, jxt_1.booleanAttribute)('prekey'),
            rid: (0, jxt_1.integerAttribute)('rid'),
            value: (0, jxt_1.textBuffer)('base64')
        },
        namespace: Namespaces_1.NS_OMEMO_AXOLOTL
    },
    {
        aliases: (0, jxt_1.pubsubItemContentAliases)(),
        element: 'list',
        fields: {
            devices: (0, jxt_1.multipleChildIntegerAttribute)(null, 'device', 'id')
        },
        namespace: Namespaces_1.NS_OMEMO_AXOLOTL,
        type: Namespaces_1.NS_OMEMO_AXOLOTL_DEVICELIST,
        typeField: 'itemType'
    },
    {
        element: 'preKeyPublic',
        fields: {
            id: (0, jxt_1.integerAttribute)('preKeyId'),
            value: (0, jxt_1.textBuffer)('base64')
        },
        namespace: Namespaces_1.NS_OMEMO_AXOLOTL,
        path: 'omemoPreKey'
    },
    {
        element: 'signedPreKeyPublic',
        fields: {
            id: (0, jxt_1.integerAttribute)('signedPreKeyId'),
            value: (0, jxt_1.textBuffer)('base64')
        },
        namespace: Namespaces_1.NS_OMEMO_AXOLOTL,
        path: 'omemoDevice.signedPreKeyPublic'
    },
    {
        aliases: (0, jxt_1.pubsubItemContentAliases)(),
        element: 'bundle',
        fields: {
            identityKey: (0, jxt_1.childTextBuffer)(null, 'identityKey', 'base64'),
            preKeys: (0, jxt_1.splicePath)(null, 'prekeys', 'omemoPreKey', true),
            signedPreKeySignature: (0, jxt_1.childTextBuffer)(null, 'signedPreKeySignature', 'base64')
        },
        namespace: Namespaces_1.NS_OMEMO_AXOLOTL,
        path: 'omemoDevice',
        type: Namespaces_1.NS_OMEMO_AXOLOTL_BUNDLES,
        typeField: 'itemType'
    }
];
exports.default = Protocol;
