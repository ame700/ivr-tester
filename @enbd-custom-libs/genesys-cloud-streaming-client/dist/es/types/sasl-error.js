export default class SaslError extends Error {
    constructor(condition, channelId, stanzaInstanceId) {
        super();
        this.condition = condition;
        this.channelId = channelId;
        this.stanzaInstanceId = stanzaInstanceId;
        this.name = 'SaslError';
    }
}
