"use strict";
// ====================================================================
// XEP-0108: User Tune
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0118.html
// Version: 1.2 (2008-01-30)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = {
    aliases: [
        {
            impliedType: true,
            path: 'tune'
        },
        ...(0, jxt_1.pubsubItemContentAliases)()
    ],
    element: 'tune',
    fields: {
        artist: (0, jxt_1.childText)(null, 'artist'),
        length: (0, jxt_1.childInteger)(null, 'length'),
        rating: (0, jxt_1.childInteger)(null, 'rating'),
        source: (0, jxt_1.childText)(null, 'source'),
        title: (0, jxt_1.childText)(null, 'title'),
        track: (0, jxt_1.childText)(null, 'track'),
        uri: (0, jxt_1.childText)(null, 'uri')
    },
    namespace: Namespaces_1.NS_TUNE,
    type: Namespaces_1.NS_TUNE
};
exports.default = Protocol;
