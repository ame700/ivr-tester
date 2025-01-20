"use strict";
// ====================================================================
// XEP-0016: Privacy Lists
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0016.html
// Version: 1.7 (2007-08-13)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    {
        element: 'query',
        fields: {
            activeList: (0, jxt_1.childAttribute)(null, 'active', 'name'),
            defaultList: (0, jxt_1.childAttribute)(null, 'default', 'name')
        },
        namespace: Namespaces_1.NS_PRIVACY,
        path: 'iq.privacy'
    },
    {
        aliases: [{ path: 'iq.privacy.lists', multiple: true }],
        element: 'list',
        fields: {
            name: (0, jxt_1.attribute)('name')
        },
        namespace: Namespaces_1.NS_PRIVACY
    },
    {
        aliases: [{ path: 'iq.privacy.lists.items', multiple: true }],
        element: 'item',
        fields: {
            action: (0, jxt_1.attribute)('action'),
            incomingPresence: (0, jxt_1.childBoolean)(null, 'presence-in'),
            iq: (0, jxt_1.childBoolean)(null, 'iq'),
            messages: (0, jxt_1.childBoolean)(null, 'message'),
            order: (0, jxt_1.integerAttribute)('order'),
            outgoingPresence: (0, jxt_1.childBoolean)(null, 'presence-out'),
            type: (0, jxt_1.attribute)('type'),
            value: (0, jxt_1.attribute)('value')
        },
        namespace: Namespaces_1.NS_PRIVACY
    }
];
exports.default = Protocol;
