"use strict";
// ====================================================================
// XEP-0176: Jingle ICE-UDP Transport Method
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0176.html
// Version: 1.0 (2009-06-10)
//
// Additional:
// - tcpType candidate attribute (matching XEP-0371)
// - gatheringComplete flag (matching XEP-0371)
//
// --------------------------------------------------------------------
// XEP-0371: Jingle ICE-UDP Transport Method
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0371.html
// Version: 0.2 (2017-09-11)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const ice = (transportType) => [
    {
        element: 'transport',
        fields: {
            gatheringComplete: (0, jxt_1.childBoolean)(null, 'gathering-complete'),
            password: (0, jxt_1.attribute)('pwd'),
            usernameFragment: (0, jxt_1.attribute)('ufrag')
        },
        namespace: transportType,
        path: 'iq.jingle.contents.transport',
        type: transportType,
        typeField: 'transportType'
    },
    {
        aliases: [
            {
                impliedType: true,
                path: 'iq.jingle.contents.transport.remoteCandidate',
                selector: transportType
            }
        ],
        element: 'remote-candidate',
        fields: {
            component: (0, jxt_1.integerAttribute)('component'),
            ip: (0, jxt_1.attribute)('ip'),
            port: (0, jxt_1.integerAttribute)('port')
        },
        namespace: transportType,
        type: transportType,
        typeField: 'transportType'
    },
    {
        aliases: [
            {
                impliedType: true,
                multiple: true,
                path: 'iq.jingle.contents.transport.candidates',
                selector: transportType
            }
        ],
        element: 'candidate',
        fields: {
            component: (0, jxt_1.integerAttribute)('component'),
            foundation: (0, jxt_1.attribute)('foundation'),
            generation: (0, jxt_1.integerAttribute)('generation'),
            id: (0, jxt_1.attribute)('id'),
            ip: (0, jxt_1.attribute)('ip'),
            network: (0, jxt_1.integerAttribute)('network'),
            port: (0, jxt_1.integerAttribute)('port'),
            priority: (0, jxt_1.integerAttribute)('priority'),
            protocol: (0, jxt_1.attribute)('protocol'),
            relatedAddress: (0, jxt_1.attribute)('rel-addr'),
            relatedPort: (0, jxt_1.attribute)('rel-port'),
            tcpType: (0, jxt_1.attribute)('tcptype'),
            type: (0, jxt_1.attribute)('type')
        },
        namespace: transportType,
        type: transportType,
        typeField: 'transportType'
    }
];
const Protocol = [...ice(Namespaces_1.NS_JINGLE_ICE_0), ...ice(Namespaces_1.NS_JINGLE_ICE_UDP_1)];
exports.default = Protocol;
