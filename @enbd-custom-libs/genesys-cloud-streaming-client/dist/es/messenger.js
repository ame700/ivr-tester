'use strict';
import { __awaiter } from "tslib";
import { Emitter } from 'strict-event-emitter';
import { toBare } from 'stanza/JID';
import { v4 } from 'uuid';
export class MessengerExtension extends Emitter {
    constructor(client, stanzaInstance) {
        super();
        this.client = client;
        this.stanzaInstance = stanzaInstance;
    }
    get bareJid() {
        return toBare(this.stanzaInstance.jid);
    }
    handleStanzaInstanceChange(stanzaInstance) {
        this.stanzaInstance = stanzaInstance;
    }
    isMediaMessage(msg) {
        return !!msg.mediaMessage;
    }
    handleMessage(msg) {
        if (!this.isMediaMessage(msg)) {
            return;
        }
        const fromMyClient = msg.from === this.stanzaInstance.jid;
        const fromMyUser = toBare(msg.from) === this.bareJid;
        this.emit('mediaMessage', Object.assign(Object.assign({}, msg), { fromMyClient, fromMyUser }));
    }
    /**
     * @param msg
     * @returns Promise<messageId>
     */
    broadcastMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = v4();
            msg.id = id;
            msg.from = this.stanzaInstance.jid;
            if (!msg.to) {
                msg.to = this.bareJid;
            }
            yield this.stanzaInstance.send('message', msg);
            return id;
        });
    }
    get expose() {
        return {
            broadcastMessage: this.broadcastMessage.bind(this),
            on: this.on.bind(this),
            once: this.once.bind(this),
            off: this.off.bind(this),
            removeListener: this.removeListener.bind(this),
            addListener: this.addListener.bind(this),
        };
    }
}
