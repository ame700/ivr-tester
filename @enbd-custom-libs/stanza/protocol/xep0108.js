"use strict";
// ====================================================================
// XEP-0108: User Activity
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0108.html
// Version: 1.3 (2008-10-29)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const Constants_1 = require("../Constants");
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = {
    aliases: [{ path: 'activity', impliedType: true }, ...(0, jxt_1.pubsubItemContentAliases)()],
    element: 'activity',
    fields: {
        activity: (0, jxt_1.childDoubleEnum)(null, Constants_1.USER_ACTIVITY_GENERAL, Constants_1.USER_ACTIVITY_SPECIFIC),
        alternateLanguageText: (0, jxt_1.childAlternateLanguageText)(null, 'text'),
        text: (0, jxt_1.childText)(null, 'text')
    },
    namespace: Namespaces_1.NS_ACTIVITY,
    type: Namespaces_1.NS_ACTIVITY
};
exports.default = Protocol;
