"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Namespaces_1 = require("../Namespaces");
function default_1(client) {
    client.discoverBindings = async (server) => {
        const bosh = new Set();
        const websocket = new Set();
        const discoverHostMeta = client.resolver
            .getHostMeta(server)
            .then(xrd => {
            var _a;
            for (const link of (_a = xrd.links) !== null && _a !== void 0 ? _a : []) {
                if (link.href && link.rel === Namespaces_1.NS_ALT_CONNECTIONS_WEBSOCKET) {
                    websocket.add(link.href);
                }
                if (link.href && link.rel === Namespaces_1.NS_ALT_CONNECTIONS_XBOSH) {
                    bosh.add(link.href);
                }
            }
        })
            .catch(err => console.error(err));
        const discoverDNS = !client.config.allowAlternateDNSDiscovery
            ? Promise.resolve()
            : client.resolver
                .resolveTXT(`_xmppconnect.${server}`)
                .then(txtRecords => {
                for (const group of txtRecords) {
                    for (const value of group) {
                        if (value.startsWith('_xmpp-client-websocket=')) {
                            const url = value.substring(value.indexOf('=') + 1);
                            if (url) {
                                websocket.add(url);
                            }
                        }
                        if (value.startsWith('_xmpp-client-xbosh=')) {
                            const url = value.substring(value.indexOf('=') + 1);
                            if (url) {
                                bosh.add(url);
                            }
                        }
                    }
                }
            })
                .catch(err => console.error(err));
        await Promise.all([discoverHostMeta, discoverDNS]).catch(err => console.error(err));
        return {
            bosh: [...bosh].filter(url => url.startsWith('https://')),
            websocket: [...websocket].filter(url => url.startsWith('wss://'))
        };
    };
}
exports.default = default_1;
