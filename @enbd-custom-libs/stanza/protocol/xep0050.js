"use strict";
// ====================================================================
// XEP-0050: Ad-Hoc Commands
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0050.html
// Version: 1.2.2 (2016-12-03)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.addAlias)(Namespaces_1.NS_DATAFORM, 'x', ['iq.command.form']),
    (0, jxt_1.extendStanzaError)({
        commandError: (0, jxt_1.childEnum)(Namespaces_1.NS_ADHOC_COMMANDS, [
            'bad-action',
            'bad-locale',
            'bad-payload',
            'bad-sessionid',
            'malformed-action',
            'session-expired'
        ])
    }),
    {
        element: 'command',
        fields: {
            action: (0, jxt_1.attribute)('action'),
            node: (0, jxt_1.attribute)('node'),
            sid: (0, jxt_1.attribute)('sessionid'),
            status: (0, jxt_1.attribute)('status')
        },
        namespace: Namespaces_1.NS_ADHOC_COMMANDS,
        path: 'iq.command'
    },
    {
        element: 'actions',
        fields: {
            complete: (0, jxt_1.childBoolean)(null, 'complete'),
            execute: (0, jxt_1.attribute)('execute'),
            next: (0, jxt_1.childBoolean)(null, 'next'),
            prev: (0, jxt_1.childBoolean)(null, 'prev')
        },
        namespace: Namespaces_1.NS_ADHOC_COMMANDS,
        path: 'iq.command.availableActions'
    },
    {
        aliases: [{ path: 'iq.command.notes', multiple: true }],
        element: 'note',
        fields: {
            type: (0, jxt_1.attribute)('type'),
            value: (0, jxt_1.text)()
        },
        namespace: Namespaces_1.NS_ADHOC_COMMANDS
    }
];
exports.default = Protocol;
