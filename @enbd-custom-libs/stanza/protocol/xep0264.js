"use strict";
// ====================================================================
// XEP-0224: Attention
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0224.html
// Version: Version 1.0 (2008-11-13)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.addAlias)(Namespaces_1.NS_BOB, 'data', [{ path: 'iq.jingle.bits', multiple: true }]),
    {
        element: 'thumbnail',
        fields: {
            height: (0, jxt_1.integerAttribute)('height'),
            mediaType: (0, jxt_1.attribute)('media-type'),
            uri: (0, jxt_1.attribute)('uri'),
            width: (0, jxt_1.integerAttribute)('width')
        },
        namespace: Namespaces_1.NS_THUMBS_1,
        path: 'thumbnail'
    }
];
exports.default = Protocol;
