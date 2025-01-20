"use strict";
// ====================================================================
// XEP-0077: In-Band Registration
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0077.html
// Version: 2.4 (2012-01-253)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    (0, jxt_1.extendStreamFeatures)({
        inbandRegistration: (0, jxt_1.childBoolean)(Namespaces_1.NS_INBAND_REGISTRATION, 'register')
    }),
    (0, jxt_1.addAlias)(Namespaces_1.NS_DATAFORM, 'x', ['iq.account.form']),
    (0, jxt_1.addAlias)(Namespaces_1.NS_OOB, 'x', ['iq.account.registrationLink']),
    {
        element: 'query',
        fields: {
            address: (0, jxt_1.childText)(null, 'address'),
            date: (0, jxt_1.childDate)(null, 'date'),
            email: (0, jxt_1.childText)(null, 'email'),
            familyName: (0, jxt_1.childText)(null, 'last'),
            fullName: (0, jxt_1.childText)(null, 'name'),
            givenName: (0, jxt_1.childText)(null, 'first'),
            instructions: (0, jxt_1.childText)(null, 'instructions'),
            key: (0, jxt_1.childText)(null, 'key'),
            locality: (0, jxt_1.childText)(null, 'city'),
            misc: (0, jxt_1.childText)(null, 'misc'),
            nick: (0, jxt_1.childText)(null, 'nick'),
            password: (0, jxt_1.childText)(null, 'password'),
            phone: (0, jxt_1.childText)(null, 'phone'),
            postalCode: (0, jxt_1.childText)(null, 'zip'),
            region: (0, jxt_1.childText)(null, 'state'),
            registered: (0, jxt_1.childBoolean)(null, 'registered'),
            remove: (0, jxt_1.childBoolean)(null, 'remove'),
            text: (0, jxt_1.childText)(null, 'text'),
            uri: (0, jxt_1.childText)(null, 'uri'),
            username: (0, jxt_1.childText)(null, 'username')
        },
        namespace: Namespaces_1.NS_REGISTER,
        path: 'iq.account'
    }
];
exports.default = Protocol;
