"use strict";
// ====================================================================
// RFC 4287: The Atom Syndication Format
// --------------------------------------------------------------------
// Source: https://tools.ietf.org/html/rfc4287
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const Protocol = [
    {
        aliases: ['atomentry', ...(0, jxt_1.pubsubItemContentAliases)()],
        element: 'entry',
        fields: {
            id: (0, jxt_1.childText)(null, 'id'),
            published: (0, jxt_1.childDate)(null, 'published'),
            updated: (0, jxt_1.childDate)(null, 'updated')
        },
        namespace: Namespaces_1.NS_ATOM,
        type: Namespaces_1.NS_ATOM,
        typeField: 'itemType'
    },
    {
        element: 'summary',
        fields: {
            text: (0, jxt_1.text)(),
            type: (0, jxt_1.attribute)('type', 'text')
        },
        namespace: Namespaces_1.NS_ATOM,
        path: 'atomentry.summary'
    },
    {
        element: 'title',
        fields: {
            text: (0, jxt_1.text)(),
            type: (0, jxt_1.attribute)('type', 'text')
        },
        namespace: Namespaces_1.NS_ATOM,
        path: 'atomentry.title'
    },
    {
        aliases: [{ path: 'atomentry.links', multiple: true }],
        element: 'link',
        fields: {
            href: (0, jxt_1.attribute)('href'),
            mediaType: (0, jxt_1.attribute)('type'),
            rel: (0, jxt_1.attribute)('rel')
        },
        namespace: Namespaces_1.NS_ATOM
    },
    {
        aliases: [{ path: 'atomentry.authors', multiple: true }],
        element: 'author',
        fields: {
            name: (0, jxt_1.childText)(null, 'name'),
            uri: (0, jxt_1.childText)(null, 'uri'),
            email: (0, jxt_1.childText)(null, 'email')
        },
        namespace: Namespaces_1.NS_ATOM
    },
    {
        aliases: [{ path: 'atomentry.contributors', multiple: true }],
        element: 'contributor',
        fields: {
            name: (0, jxt_1.childText)(null, 'name'),
            uri: (0, jxt_1.childText)(null, 'uri'),
            email: (0, jxt_1.childText)(null, 'email')
        },
        namespace: Namespaces_1.NS_ATOM
    },
    {
        aliases: [{ path: 'atomentry.categories', multiple: true }],
        element: 'category',
        fields: {
            term: (0, jxt_1.attribute)('term'),
            scheme: (0, jxt_1.attribute)('scheme'),
            label: (0, jxt_1.attribute)('label')
        },
        namespace: Namespaces_1.NS_ATOM
    },
    {
        element: 'content',
        fields: {
            text: (0, jxt_1.text)(),
            type: (0, jxt_1.attribute)('type', 'text')
        },
        namespace: Namespaces_1.NS_ATOM,
        path: 'atomentry.content'
    },
    {
        element: 'rights',
        fields: {
            text: (0, jxt_1.text)(),
            type: (0, jxt_1.attribute)('type', 'text')
        },
        namespace: Namespaces_1.NS_ATOM,
        path: 'atomentry.rights'
    }
];
exports.default = Protocol;
