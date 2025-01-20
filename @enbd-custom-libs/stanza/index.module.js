import Client from './Client';
import * as Constants from './Constants';
import * as RTT from './helpers/RTT';
import * as JID from './JID';
import * as Jingle from './jingle';
import * as JXT from './jxt';
import * as LibSASL from './lib/sasl';
import * as Namespaces from './Namespaces';
import * as Stanzas from './protocol';
import * as Utils from './Utils';
import * as Platform from './platform';
export * from './helpers/StreamManagement';
import * as RSM from './helpers/RSM';
import * as DataForms from './helpers/DataForms';
export { Client, Constants, DataForms, JXT, JID, Namespaces, Stanzas, Jingle, Utils, RSM, RTT, LibSASL as SASL, Platform };
export const VERSION = Constants.VERSION;
import Plugins from './plugins';
export * from './plugins';
export function createClient(opts) {
    const client = new Client(opts);
    client.use(Plugins);
    return client;
}
