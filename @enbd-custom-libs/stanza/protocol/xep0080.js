"use strict";
// ====================================================================
// XEP-0080: User Location
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0080.html
// Version: 1.9 (2015-12-01)
//
// Additional:
// --------------------------------------------------------------------
// XEP-0350: Data Forms Geolocation Element
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0350.html
// Version: 0.2 (2017-09-11)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = {
    aliases: [
        { path: 'message.geoloc', impliedType: true },
        { path: 'dataform.fields.geoloc', impliedType: true },
        ...(0, jxt_1.pubsubItemContentAliases)()
    ],
    element: 'geoloc',
    fields: {
        accuracy: (0, jxt_1.childFloat)(null, 'accuracy'),
        altitude: (0, jxt_1.childFloat)(null, 'alt'),
        altitudeAccuracy: (0, jxt_1.childFloat)(null, 'altaccuracy'),
        area: (0, jxt_1.childText)(null, 'area'),
        building: (0, jxt_1.childText)(null, 'building'),
        country: (0, jxt_1.childText)(null, 'country'),
        countryCode: (0, jxt_1.childText)(null, 'countrycode'),
        datum: (0, jxt_1.childText)(null, 'datum'),
        description: (0, jxt_1.childText)(null, 'description'),
        error: (0, jxt_1.childFloat)(null, 'error'),
        floor: (0, jxt_1.childText)(null, 'floor'),
        heading: (0, jxt_1.childFloat)(null, 'bearing'),
        lang: (0, jxt_1.languageAttribute)(),
        latitude: (0, jxt_1.childFloat)(null, 'lat'),
        locality: (0, jxt_1.childText)(null, 'locality'),
        longitude: (0, jxt_1.childFloat)(null, 'lon'),
        postalCode: (0, jxt_1.childText)(null, 'postalcode'),
        region: (0, jxt_1.childText)(null, 'region'),
        room: (0, jxt_1.childText)(null, 'room'),
        speed: (0, jxt_1.childFloat)(null, 'speed'),
        street: (0, jxt_1.childText)(null, 'street'),
        text: (0, jxt_1.childText)(null, 'text'),
        timestamp: (0, jxt_1.childDate)(null, 'timestamp'),
        tzo: (0, jxt_1.childTimezoneOffset)(null, 'tzo'),
        uri: (0, jxt_1.childText)(null, 'uri')
    },
    namespace: Namespaces_1.NS_GEOLOC,
    type: Namespaces_1.NS_GEOLOC
};
exports.default = Protocol;
