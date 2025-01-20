"use strict";
// ====================================================================
// XEP-0172: User Nickname
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0172.html
// Version: 1.1 (2012-03-21)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.extendMessage)({
        nick: (0, jxt_1.childText)(Namespaces_1.NS_NICK, 'nick')
    }),
    (0, jxt_1.extendPresence)({
        nick: (0, jxt_1.childText)(Namespaces_1.NS_NICK, 'nick')
    }),
    {
        aliases: (0, jxt_1.pubsubItemContentAliases)(),
        element: 'nick',
        fields: {
            nick: (0, jxt_1.text)()
        },
        namespace: Namespaces_1.NS_NICK,
        type: Namespaces_1.NS_NICK
    }
];
exports.default = Protocol;
