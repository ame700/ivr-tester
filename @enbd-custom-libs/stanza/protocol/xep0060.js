"use strict";
// ====================================================================
// XEP-0060: Publish-Subscribe
// --------------------------------------------------------------------
// Source: https://xmpp.org/extensions/xep-0060.html
// Version: 1.15.1 (2018-02-02)
// ====================================================================
Object.defineProperty(exports, "__esModule", { value: true });
const Constants_1 = require("../Constants");
const jxt_1 = require("../jxt");
const Namespaces_1 = require("../Namespaces");
const dateOrPresenceAttribute = (name) => ({
    importer(xml) {
        const data = xml.getAttribute(name);
        if (data === 'presence') {
            return data;
        }
        if (data) {
            return new Date(data);
        }
    },
    exporter(xml, value) {
        let data;
        if (typeof value === 'string') {
            data = value;
        }
        else {
            data = value.toISOString();
        }
        xml.setAttribute(name, data);
    }
});
const SubscriptionFields = {
    configurable: (0, jxt_1.childBoolean)(null, 'subscribe-options'),
    configurationRequired: (0, jxt_1.deepChildBoolean)([
        { namespace: null, element: 'subscribe-options' },
        { namespace: null, element: 'required' }
    ]),
    jid: (0, jxt_1.JIDAttribute)('jid'),
    node: (0, jxt_1.attribute)('node'),
    state: (0, jxt_1.attribute)('subscription'),
    subid: (0, jxt_1.attribute)('subid')
};
const NodeOnlyField = {
    node: (0, jxt_1.attribute)('node')
};
const Protocol = [
    {
        aliases: ['pubsub', 'iq.pubsub', 'message.pubsub'],
        childrenExportOrder: {
            configure: 0,
            create: 100,
            publish: 100,
            subscribe: 100,
            subscriptionOptions: 0
        },
        defaultType: 'user',
        element: 'pubsub',
        fields: {
            publishOptions: (0, jxt_1.splicePath)(null, 'publish-options', 'dataform')
        },
        namespace: Namespaces_1.NS_PUBSUB,
        type: 'user',
        typeField: 'context'
    },
    {
        aliases: ['pubsub', 'iq.pubsub', 'message.pubsub'],
        defaultType: 'user',
        element: 'pubsub',
        fields: {
            purge: (0, jxt_1.childAttribute)(null, 'purge', 'node')
        },
        namespace: Namespaces_1.NS_PUBSUB_OWNER,
        type: 'owner',
        typeField: 'context'
    },
    (0, jxt_1.addAlias)(Namespaces_1.NS_DATAFORM, 'x', [
        'iq.pubsub.configure.form',
        'iq.pubsub.defaultConfiguration.form',
        'iq.pubsub.defaultSubscriptionOptions.form',
        'iq.pubsub.subscriptionOptions.form',
        'message.pubsub.configuration.form'
    ]),
    (0, jxt_1.addAlias)(Namespaces_1.NS_RSM, 'set', ['iq.pubsub.fetch.paging']),
    (0, jxt_1.extendStanzaError)({
        pubsubError: (0, jxt_1.childEnum)(Namespaces_1.NS_PUBSUB_ERRORS, Object.values(Constants_1.PubsubErrorCondition)),
        pubsubUnsupportedFeature: (0, jxt_1.childAttribute)(Namespaces_1.NS_PUBSUB_ERRORS, 'unsupported', 'feature')
    }),
    {
        element: 'subscribe',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node')
        },
        namespace: Namespaces_1.NS_PUBSUB,
        path: 'iq.pubsub.subscribe'
    },
    {
        element: 'unsubscribe',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node'),
            subid: (0, jxt_1.attribute)('subid')
        },
        namespace: Namespaces_1.NS_PUBSUB,
        path: 'iq.pubsub.unsubscribe'
    },
    {
        element: 'options',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node'),
            subid: (0, jxt_1.attribute)('subid')
        },
        namespace: Namespaces_1.NS_PUBSUB,
        path: 'iq.pubsub.subscriptionOptions'
    },
    {
        aliases: [{ path: 'iq.pubsub.subscriptions', selector: 'user', impliedType: true }],
        element: 'subscriptions',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node')
        },
        namespace: Namespaces_1.NS_PUBSUB,
        type: 'user'
    },
    {
        aliases: [{ path: 'iq.pubsub.subscriptions', selector: 'owner', impliedType: true }],
        element: 'subscriptions',
        fields: {
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node')
        },
        namespace: Namespaces_1.NS_PUBSUB_OWNER,
        type: 'owner'
    },
    {
        aliases: [
            { path: 'iq.pubsub.subscription', selector: 'owner' },
            {
                impliedType: true,
                multiple: true,
                path: 'iq.pubsub.subscriptions.items',
                selector: 'owner'
            }
        ],
        element: 'subscription',
        fields: SubscriptionFields,
        namespace: Namespaces_1.NS_PUBSUB
    },
    {
        aliases: [
            { path: 'iq.pubsub.subscription', selector: 'user' },
            {
                impliedType: true,
                multiple: true,
                path: 'iq.pubsub.subscriptions.items',
                selector: 'user'
            }
        ],
        element: 'subscription',
        fields: SubscriptionFields,
        namespace: Namespaces_1.NS_PUBSUB,
        type: 'user'
    },
    {
        aliases: [
            {
                impliedType: true,
                multiple: true,
                path: 'iq.pubsub.subscriptions.items',
                selector: 'owner'
            }
        ],
        element: 'subscription',
        fields: SubscriptionFields,
        namespace: Namespaces_1.NS_PUBSUB_OWNER,
        type: 'owner'
    },
    {
        aliases: [
            { path: 'iq.pubsub.affiliations', selector: 'user', impliedType: true },
            { path: 'message.pubsub.affiliations', selector: 'user', impliedType: true }
        ],
        element: 'affiliations',
        fields: NodeOnlyField,
        namespace: Namespaces_1.NS_PUBSUB,
        type: 'user'
    },
    {
        aliases: [{ path: 'iq.pubsub.affiliations', selector: 'owner', impliedType: true }],
        element: 'affiliations',
        fields: NodeOnlyField,
        namespace: Namespaces_1.NS_PUBSUB_OWNER,
        type: 'owner'
    },
    {
        aliases: [
            {
                impliedType: true,
                multiple: true,
                path: 'iq.pubsub.affiliations.items',
                selector: 'user'
            },
            {
                impliedType: true,
                multiple: true,
                path: 'message.pubsub.affiliations.items',
                selector: 'user'
            }
        ],
        element: 'affiliation',
        fields: {
            affiliation: (0, jxt_1.attribute)('affiliation'),
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node')
        },
        namespace: Namespaces_1.NS_PUBSUB,
        type: 'user'
    },
    {
        aliases: [
            {
                impliedType: true,
                multiple: true,
                path: 'iq.pubsub.affiliations.items',
                selector: 'owner'
            }
        ],
        element: 'affiliation',
        fields: {
            affiliation: (0, jxt_1.attribute)('affiliation'),
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node')
        },
        namespace: Namespaces_1.NS_PUBSUB_OWNER,
        type: 'owner'
    },
    {
        element: 'create',
        fields: NodeOnlyField,
        namespace: Namespaces_1.NS_PUBSUB,
        path: 'iq.pubsub.create'
    },
    {
        aliases: [{ path: 'iq.pubsub.destroy', selector: 'owner' }],
        element: 'delete',
        fields: {
            node: (0, jxt_1.attribute)('node'),
            redirect: (0, jxt_1.childAttribute)(null, 'redirect', 'uri')
        },
        namespace: Namespaces_1.NS_PUBSUB_OWNER
    },
    {
        aliases: [{ path: 'iq.pubsub.configure', selector: 'owner', impliedType: true }],
        element: 'configure',
        fields: NodeOnlyField,
        namespace: Namespaces_1.NS_PUBSUB_OWNER,
        type: 'owner'
    },
    {
        aliases: [{ path: 'iq.pubsub.configure', selector: 'user', impliedType: true }],
        element: 'configure',
        fields: NodeOnlyField,
        namespace: Namespaces_1.NS_PUBSUB,
        type: 'user'
    },
    {
        element: 'default',
        fields: {
            node: (0, jxt_1.attribute)('node')
        },
        namespace: Namespaces_1.NS_PUBSUB,
        path: 'iq.pubsub.defaultSubscriptionOptions'
    },
    {
        element: 'default',
        fields: {},
        namespace: Namespaces_1.NS_PUBSUB_OWNER,
        path: 'iq.pubsub.defaultConfiguration'
    },
    {
        element: 'publish',
        fields: NodeOnlyField,
        namespace: Namespaces_1.NS_PUBSUB,
        path: 'iq.pubsub.publish'
    },
    {
        element: 'retract',
        fields: {
            id: (0, jxt_1.childAttribute)(null, 'item', 'id'),
            node: (0, jxt_1.attribute)('node'),
            notify: (0, jxt_1.booleanAttribute)('notify')
        },
        namespace: Namespaces_1.NS_PUBSUB,
        path: 'iq.pubsub.retract'
    },
    {
        element: 'items',
        fields: {
            max: (0, jxt_1.integerAttribute)('max_items'),
            node: (0, jxt_1.attribute)('node')
        },
        namespace: Namespaces_1.NS_PUBSUB,
        path: 'iq.pubsub.fetch'
    },
    {
        aliases: [
            'pubsubitem',
            'iq.pubsub.publish.item',
            { multiple: true, path: 'iq.pubsub.fetch.items' }
        ],
        element: 'item',
        fields: {
            id: (0, jxt_1.attribute)('id'),
            publisher: (0, jxt_1.JIDAttribute)('publisher')
        },
        namespace: Namespaces_1.NS_PUBSUB
    },
    {
        element: 'event',
        fields: {
            eventType: (0, jxt_1.childEnum)(null, [
                'purge',
                'delete',
                'subscription',
                'configuration',
                'items'
            ])
        },
        namespace: Namespaces_1.NS_PUBSUB_EVENT,
        path: 'message.pubsub',
        type: 'event',
        typeField: 'context'
    },
    {
        aliases: [{ path: 'message.pubsub.items.published', multiple: true }],
        element: 'item',
        fields: {
            id: (0, jxt_1.attribute)('id'),
            publisher: (0, jxt_1.JIDAttribute)('publisher')
        },
        namespace: Namespaces_1.NS_PUBSUB_EVENT,
        path: 'pubsubeventitem'
    },
    {
        element: 'purge',
        fields: NodeOnlyField,
        namespace: Namespaces_1.NS_PUBSUB_EVENT,
        path: 'message.pubsub.purge'
    },
    {
        element: 'delete',
        fields: {
            node: (0, jxt_1.attribute)('node'),
            redirect: (0, jxt_1.childAttribute)(null, 'redirect', 'uri')
        },
        namespace: Namespaces_1.NS_PUBSUB_EVENT,
        path: 'message.pubsub.delete'
    },
    {
        aliases: [{ path: 'message.pubsub.subscription', selector: 'event', impliedType: true }],
        element: 'subscription',
        fields: {
            expires: dateOrPresenceAttribute('expiry'),
            jid: (0, jxt_1.JIDAttribute)('jid'),
            node: (0, jxt_1.attribute)('node'),
            subid: (0, jxt_1.attribute)('subid'),
            type: (0, jxt_1.attribute)('subscription')
        },
        namespace: Namespaces_1.NS_PUBSUB_EVENT,
        type: 'event'
    },
    {
        element: 'configuration',
        fields: NodeOnlyField,
        namespace: Namespaces_1.NS_PUBSUB_EVENT,
        path: 'message.pubsub.configuration'
    },
    {
        element: 'items',
        fields: {
            node: (0, jxt_1.attribute)('node'),
            retracted: (0, jxt_1.multipleChildAttribute)(null, 'retract', 'id')
        },
        namespace: Namespaces_1.NS_PUBSUB_EVENT,
        path: 'message.pubsub.items'
    }
];
exports.default = Protocol;
