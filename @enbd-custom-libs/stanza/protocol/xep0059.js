"use strict";
// ====================================================================
// XEP-0059: Result Set Management
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0059.html
// Version: 1.0.0 (2006-09-20)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = {
    aliases: ['iq.pubsub.paging'],
    element: 'set',
    fields: {
        after: (0, jxt_1.childText)(null, 'after'),
        before: (0, jxt_1.childText)(null, 'before'),
        count: (0, jxt_1.childInteger)(null, 'count'),
        first: (0, jxt_1.childText)(null, 'first'),
        firstIndex: (0, jxt_1.childIntegerAttribute)(null, 'first', 'index'),
        index: (0, jxt_1.childInteger)(null, 'index'),
        last: (0, jxt_1.childText)(null, 'last'),
        max: (0, jxt_1.childInteger)(null, 'max')
    },
    namespace: Namespaces_1.NS_RSM,
    path: 'paging'
};
exports.default = Protocol;
