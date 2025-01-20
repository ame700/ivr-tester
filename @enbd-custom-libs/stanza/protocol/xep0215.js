"use strict";
// ====================================================================
// XEP-0215: External Service Discovery
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0215.html
// Version: 0.6 (2014-02-27)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const versions = {
    '2': Namespaces_1.NS_DISCO_EXTERNAL_2,
    '1': Namespaces_1.NS_DISCO_EXTERNAL_1
};
const Protocol = [];
for (const [version, namespace] of Object.entries(versions)) {
    Protocol.push({
        aliases: ['iq.externalServiceCredentials'],
        defaultType: '2',
        element: 'credentials',
        fields: {
            expires: (0, jxt_1.childDateAttribute)(null, 'service', 'expires'),
            host: (0, jxt_1.childAttribute)(null, 'service', 'host'),
            name: (0, jxt_1.childAttribute)(null, 'service', 'name'),
            password: (0, jxt_1.childAttribute)(null, 'service', 'password'),
            port: (0, jxt_1.childIntegerAttribute)(null, 'service', 'port'),
            restricted: (0, jxt_1.childBooleanAttribute)(null, 'service', 'restricted'),
            transport: (0, jxt_1.childAttribute)(null, 'service', 'transport'),
            type: (0, jxt_1.childAttribute)(null, 'service', 'type'),
            username: (0, jxt_1.childAttribute)(null, 'service', 'username')
        },
        namespace,
        type: version,
        typeField: 'version'
    }, {
        aliases: ['iq.externalServices'],
        defaultType: '2',
        element: 'services',
        fields: {
            type: (0, jxt_1.attribute)('type')
        },
        namespace,
        type: version,
        typeField: 'version'
    }, {
        aliases: [{ path: 'iq.externalServices.services', multiple: true }],
        defaultType: '2',
        element: 'service',
        fields: {
            expires: (0, jxt_1.dateAttribute)('expires'),
            host: (0, jxt_1.attribute)('host'),
            name: (0, jxt_1.attribute)('name'),
            password: (0, jxt_1.attribute)('password'),
            port: (0, jxt_1.integerAttribute)('port'),
            restricted: (0, jxt_1.booleanAttribute)('restricted'),
            transport: (0, jxt_1.attribute)('transport'),
            type: (0, jxt_1.attribute)('type'),
            username: (0, jxt_1.attribute)('username')
        },
        namespace,
        type: version,
        typeField: 'version'
    });
}
exports.default = Protocol;
