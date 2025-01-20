"use strict";
// ====================================================================
// XEP-0124: Bidirectional-streams Over Synchronous HTTP (BOSH)
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0124.html
// Version: 1.11.1 (2016-11-16)
//
// Additional:
// --------------------------------------------------------------------
// XEP-0206: XMPP over BOSH
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0206.html
// Version: 1.4 (2014-04-09)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = {
    element: 'body',
    fields: {
        acceptMediaTypes: (0, jxt_1.attribute)('accept'),
        ack: (0, jxt_1.integerAttribute)('ack'),
        authId: (0, jxt_1.attribute)('authid'),
        characterSets: (0, jxt_1.attribute)('charsets'),
        condition: (0, jxt_1.attribute)('condition'),
        from: (0, jxt_1.JIDAttribute)('from'),
        key: (0, jxt_1.attribute)('key'),
        lang: (0, jxt_1.languageAttribute)(),
        maxClientRequests: (0, jxt_1.integerAttribute)('requests'),
        maxHoldOpen: (0, jxt_1.integerAttribute)('hold'),
        maxInactivityTime: (0, jxt_1.integerAttribute)('inactivity'),
        maxSessionPause: (0, jxt_1.integerAttribute)('maxpause'),
        maxWaitTime: (0, jxt_1.integerAttribute)('wait'),
        mediaType: (0, jxt_1.attribute)('content'),
        minPollingInterval: (0, jxt_1.integerAttribute)('polling'),
        newKey: (0, jxt_1.attribute)('newkey'),
        pauseSession: (0, jxt_1.integerAttribute)('pause'),
        report: (0, jxt_1.integerAttribute)('report'),
        rid: (0, jxt_1.integerAttribute)('rid'),
        route: (0, jxt_1.attribute)('string'),
        seeOtherURI: (0, jxt_1.childText)(null, 'uri'),
        sid: (0, jxt_1.attribute)('sid'),
        stream: (0, jxt_1.attribute)('stream'),
        time: (0, jxt_1.integerAttribute)('time'),
        to: (0, jxt_1.JIDAttribute)('to'),
        type: (0, jxt_1.attribute)('type'),
        version: (0, jxt_1.attribute)('ver'),
        // XEP-0206
        xmppRestart: (0, jxt_1.namespacedBooleanAttribute)('xmpp', Namespaces_1.NS_BOSH_XMPP, 'restart', undefined, {
            writeValue: (value) => {
                return value ? 'true' : 'false';
            }
        }),
        xmppRestartLogic: (0, jxt_1.namespacedBooleanAttribute)('xmpp', Namespaces_1.NS_BOSH_XMPP, 'restartlogic', undefined, {
            writeValue: (value) => {
                return value ? 'true' : 'false';
            }
        }),
        xmppVersion: (0, jxt_1.namespacedAttribute)('xmpp', Namespaces_1.NS_BOSH_XMPP, 'version')
    },
    namespace: Namespaces_1.NS_BOSH,
    path: 'bosh'
};
exports.default = Protocol;
