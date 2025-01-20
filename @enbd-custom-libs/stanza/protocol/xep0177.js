"use strict";
// ====================================================================
// XEP-0177: Jingle Raw UDP Transport Method
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0177.html
// Version: 1.1 (2009-12-23)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    {
        element: 'transport',
        fields: {
            gatheringComplete: (0, jxt_1.childBoolean)(null, 'gathering-complete'),
            password: (0, jxt_1.attribute)('pwd'),
            usernameFragment: (0, jxt_1.attribute)('ufrag')
        },
        namespace: Namespaces_1.NS_JINGLE_RAW_UDP_1,
        path: 'iq.jingle.contents.transport',
        type: Namespaces_1.NS_JINGLE_RAW_UDP_1,
        typeField: 'transportType'
    },
    {
        aliases: [
            {
                impliedType: true,
                multiple: true,
                path: 'iq.jingle.contents.transport.candidates',
                selector: Namespaces_1.NS_JINGLE_RAW_UDP_1
            }
        ],
        element: 'candidate',
        fields: {
            component: (0, jxt_1.integerAttribute)('component'),
            foundation: (0, jxt_1.attribute)('foundation'),
            generation: (0, jxt_1.integerAttribute)('generation'),
            id: (0, jxt_1.attribute)('id'),
            ip: (0, jxt_1.attribute)('ip'),
            port: (0, jxt_1.integerAttribute)('port'),
            type: (0, jxt_1.attribute)('type')
        },
        namespace: Namespaces_1.NS_JINGLE_RAW_UDP_1,
        type: Namespaces_1.NS_JINGLE_RAW_UDP_1,
        typeField: 'transportType'
    }
];
exports.default = Protocol;
