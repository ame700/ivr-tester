"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCRAM = exports.DIGEST = exports.OAUTH = exports.PLAIN = exports.EXTERNAL = exports.ANONYMOUS = exports.Hi = exports.HMAC = exports.H = exports.XOR = exports.createClientNonce = exports.Factory = exports.SimpleMech = void 0;
const platform_1 = require("../../platform");
const stringprep_1 = require("../stringprep");
class SimpleMech {
    constructor(name) {
        this.authenticated = false;
        this.mutuallyAuthenticated = false;
        this.name = name;
    }
    getCacheableCredentials() {
        return null;
    }
    // istanbul ignore next
    processChallenge(_challenge) {
        return;
    }
    processSuccess(_success) {
        this.authenticated = true;
    }
    finalize() {
        const result = {
            authenticated: this.authenticated,
            mutuallyAuthenticated: this.mutuallyAuthenticated
        };
        if (this.errorData) {
            result.errorData = this.errorData;
        }
        return result;
    }
}
exports.SimpleMech = SimpleMech;
class Factory {
    constructor() {
        this.mechanisms = [];
    }
    register(name, constructor, priority) {
        this.mechanisms.push({
            constructor,
            name: name.toUpperCase(),
            priority: priority
        });
        // We want mechanisms with highest priority at the start of the list
        this.mechanisms.sort((a, b) => b.priority - a.priority);
    }
    disable(name) {
        const mechName = name.toUpperCase();
        this.mechanisms = this.mechanisms.filter(mech => mech.name !== mechName);
    }
    createMechanism(names) {
        const availableNames = names.map(name => name.toUpperCase());
        for (const knownMech of this.mechanisms) {
            for (const availableMechName of availableNames) {
                if (availableMechName === knownMech.name) {
                    return new knownMech.constructor(knownMech.name);
                }
            }
        }
        return null;
    }
}
exports.Factory = Factory;
// ====================================================================
// Utility helpers
// ====================================================================
// istanbul ignore next
function createClientNonce(length = 32) {
    return (0, platform_1.randomBytes)(length).toString('hex');
}
exports.createClientNonce = createClientNonce;
// tslint:disable no-bitwise
function XOR(a, b) {
    const res = [];
    for (let i = 0; i < a.length; i++) {
        res.push(a[i] ^ b[i]);
    }
    return platform_1.Buffer.from(res);
}
exports.XOR = XOR;
// tslint:enable no-bitwise
function H(text, alg) {
    return (0, platform_1.createHash)(alg).update(text).digest();
}
exports.H = H;
function HMAC(key, msg, alg) {
    return (0, platform_1.createHmac)(alg, key).update(msg).digest();
}
exports.HMAC = HMAC;
function Hi(text, salt, iterations, alg) {
    let ui1 = HMAC(text, platform_1.Buffer.concat([salt, platform_1.Buffer.from('00000001', 'hex')]), alg);
    let ui = ui1;
    for (let i = 0; i < iterations - 1; i++) {
        ui1 = HMAC(text, ui1, alg);
        ui = XOR(ui, ui1);
    }
    return ui;
}
exports.Hi = Hi;
function parse(challenge) {
    const directives = {};
    const tokens = challenge.toString().split(/,(?=(?:[^"]|"[^"]*")*$)/);
    for (let i = 0, len = tokens.length; i < len; i++) {
        const directive = /(\w+)=["]?([^"]+)["]?$/.exec(tokens[i]);
        if (directive) {
            directives[directive[1]] = directive[2];
        }
    }
    return directives;
}
function escapeUsername(name) {
    const escaped = [];
    for (const curr of name) {
        if (curr === ',') {
            escaped.push('=2C');
        }
        else if (curr === '=') {
            escaped.push('=3D');
        }
        else {
            escaped.push(curr);
        }
    }
    return escaped.join('');
}
// ====================================================================
// ANONYMOUS
// ====================================================================
class ANONYMOUS extends SimpleMech {
    getExpectedCredentials() {
        return { optional: ['trace'], required: [] };
    }
    createResponse(credentials) {
        return platform_1.Buffer.from(credentials.trace || '');
    }
}
exports.ANONYMOUS = ANONYMOUS;
// ====================================================================
// EXTERNAL
// ====================================================================
class EXTERNAL extends SimpleMech {
    getExpectedCredentials() {
        return { optional: ['authzid'], required: [] };
    }
    createResponse(credentials) {
        return platform_1.Buffer.from(credentials.authzid || '');
    }
}
exports.EXTERNAL = EXTERNAL;
// ====================================================================
// PLAIN
// ====================================================================
class PLAIN extends SimpleMech {
    getExpectedCredentials() {
        return {
            optional: ['authzid'],
            required: ['username', 'password']
        };
    }
    createResponse(credentials) {
        return platform_1.Buffer.from((credentials.authzid || '') +
            '\x00' +
            credentials.username +
            '\x00' +
            (credentials.password || credentials.token));
    }
}
exports.PLAIN = PLAIN;
// ====================================================================
// OAUTHBEARER
// ====================================================================
class OAUTH extends SimpleMech {
    constructor(name) {
        super(name);
        this.failed = false;
        this.name = name;
    }
    getExpectedCredentials() {
        return {
            optional: ['authzid'],
            required: ['token']
        };
    }
    createResponse(credentials) {
        if (this.failed) {
            return platform_1.Buffer.from('\u0001');
        }
        const gs2header = `n,${escapeUsername((0, stringprep_1.saslprep)(credentials.authzid))},`;
        const auth = `auth=Bearer ${credentials.token}\u0001`;
        return platform_1.Buffer.from(gs2header + '\u0001' + auth + '\u0001', 'utf8');
    }
    processChallenge(challenge) {
        this.failed = true;
        this.errorData = JSON.parse(challenge.toString('utf8'));
    }
}
exports.OAUTH = OAUTH;
// ====================================================================
// DIGEST-MD5
// ====================================================================
class DIGEST extends SimpleMech {
    constructor(name) {
        super(name);
        this.providesMutualAuthentication = false;
        this.state = 'INITIAL';
        this.name = name;
    }
    processChallenge(challenge) {
        this.state = 'CHALLENGE';
        const values = parse(challenge);
        this.authenticated = !!values.rspauth;
        this.realm = values.realm;
        this.nonce = values.nonce;
        this.charset = values.charset;
    }
    getExpectedCredentials() {
        return {
            optional: ['authzid', 'clientNonce', 'realm'],
            required: ['host', 'password', 'serviceName', 'serviceType', 'username']
        };
    }
    createResponse(credentials) {
        if (this.state === 'INITIAL' || this.authenticated) {
            return null;
        }
        let uri = credentials.serviceType + '/' + credentials.host;
        if (credentials.serviceName && credentials.host !== credentials.serviceName) {
            uri += '/' + credentials.serviceName;
        }
        const realm = credentials.realm || this.realm || '';
        const cnonce = credentials.clientNonce || createClientNonce(16);
        const nc = '00000001';
        const qop = 'auth';
        let str = '';
        str += 'username="' + credentials.username + '"';
        if (realm) {
            str += ',realm="' + realm + '"';
        }
        str += ',nonce="' + this.nonce + '"';
        str += ',cnonce="' + cnonce + '"';
        str += ',nc=' + nc;
        str += ',qop=' + qop;
        str += ',digest-uri="' + uri + '"';
        const base = (0, platform_1.createHash)('md5')
            .update(credentials.username)
            .update(':')
            .update(realm)
            .update(':')
            .update(credentials.password)
            .digest();
        const ha1 = (0, platform_1.createHash)('md5')
            .update(base)
            .update(':')
            .update(this.nonce)
            .update(':')
            .update(cnonce);
        if (credentials.authzid) {
            ha1.update(':').update(credentials.authzid);
        }
        const dha1 = ha1.digest('hex');
        const ha2 = (0, platform_1.createHash)('md5').update('AUTHENTICATE:').update(uri);
        const dha2 = ha2.digest('hex');
        const digest = (0, platform_1.createHash)('md5')
            .update(dha1)
            .update(':')
            .update(this.nonce)
            .update(':')
            .update(nc)
            .update(':')
            .update(cnonce)
            .update(':')
            .update(qop)
            .update(':')
            .update(dha2)
            .digest('hex');
        str += ',response=' + digest;
        if (this.charset === 'utf-8') {
            str += ',charset=utf-8';
        }
        if (credentials.authzid) {
            str += ',authzid="' + credentials.authzid + '"';
        }
        return platform_1.Buffer.from(str);
    }
}
exports.DIGEST = DIGEST;
// ====================================================================
// SCRAM-SHA-1(-PLUS)
// ====================================================================
class SCRAM {
    constructor(name) {
        this.providesMutualAuthentication = true;
        this.name = name;
        this.state = 'INITIAL';
        this.useChannelBinding = this.name.toLowerCase().endsWith('-plus');
        this.algorithm = this.name.toLowerCase().split('scram-')[1].split('-plus')[0];
    }
    getExpectedCredentials() {
        const optional = ['authzid', 'clientNonce'];
        const required = ['username', 'password'];
        if (this.useChannelBinding) {
            required.push('tlsUnique');
        }
        return {
            optional,
            required
        };
    }
    getCacheableCredentials() {
        return this.cache;
    }
    createResponse(credentials) {
        if (this.state === 'INITIAL') {
            return this.initialResponse(credentials);
        }
        return this.challengeResponse(credentials);
    }
    processChallenge(challenge) {
        const values = parse(challenge);
        this.salt = platform_1.Buffer.from(values.s || '', 'base64');
        this.iterationCount = parseInt(values.i, 10);
        this.nonce = values.r;
        this.verifier = values.v;
        this.error = values.e;
        this.challenge = challenge;
    }
    processSuccess(success) {
        this.processChallenge(success);
    }
    finalize() {
        if (!this.verifier) {
            return {
                authenticated: false,
                error: this.error,
                mutuallyAuthenticated: false
            };
        }
        if (this.serverSignature.toString('base64') !== this.verifier) {
            return {
                authenticated: false,
                error: 'Mutual authentication failed',
                mutuallyAuthenticated: false
            };
        }
        return {
            authenticated: true,
            mutuallyAuthenticated: true
        };
    }
    initialResponse(credentials) {
        const authzid = escapeUsername((0, stringprep_1.saslprep)(credentials.authzid));
        const username = escapeUsername((0, stringprep_1.saslprep)(credentials.username));
        this.clientNonce = credentials.clientNonce || createClientNonce();
        let cbindHeader = 'n';
        if (credentials.tlsUnique) {
            if (!this.useChannelBinding) {
                cbindHeader = 'y';
            }
            else {
                cbindHeader = 'p=tls-unique';
            }
        }
        this.gs2Header = platform_1.Buffer.from(authzid ? `${cbindHeader},a=${authzid},` : `${cbindHeader},,`);
        this.clientFirstMessageBare = platform_1.Buffer.from(`n=${username},r=${this.clientNonce}`);
        const result = platform_1.Buffer.concat([this.gs2Header, this.clientFirstMessageBare]);
        this.state = 'CHALLENGE';
        return result;
    }
    challengeResponse(credentials) {
        const CLIENT_KEY = platform_1.Buffer.from('Client Key');
        const SERVER_KEY = platform_1.Buffer.from('Server Key');
        const cbindData = platform_1.Buffer.concat([
            this.gs2Header,
            credentials.tlsUnique || platform_1.Buffer.from('')
        ]).toString('base64');
        const clientFinalMessageWithoutProof = platform_1.Buffer.from(`c=${cbindData},r=${this.nonce}`);
        let saltedPassword;
        let clientKey;
        let serverKey;
        // If our cached salt is the same, we can reuse cached credentials to speed
        // up the hashing process.
        const cached = credentials.salt && platform_1.Buffer.compare(credentials.salt, this.salt) === 0;
        if (cached && credentials.clientKey && credentials.serverKey) {
            clientKey = platform_1.Buffer.from(credentials.clientKey);
            serverKey = platform_1.Buffer.from(credentials.serverKey);
        }
        else if (cached && credentials.saltedPassword) {
            saltedPassword = platform_1.Buffer.from(credentials.saltedPassword);
            clientKey = HMAC(saltedPassword, CLIENT_KEY, this.algorithm);
            serverKey = HMAC(saltedPassword, SERVER_KEY, this.algorithm);
        }
        else {
            saltedPassword = Hi(platform_1.Buffer.from((0, stringprep_1.saslprep)(credentials.password)), this.salt, this.iterationCount, this.algorithm);
            clientKey = HMAC(saltedPassword, CLIENT_KEY, this.algorithm);
            serverKey = HMAC(saltedPassword, SERVER_KEY, this.algorithm);
        }
        const storedKey = H(clientKey, this.algorithm);
        const separator = platform_1.Buffer.from(',');
        const authMessage = platform_1.Buffer.concat([
            this.clientFirstMessageBare,
            separator,
            this.challenge,
            separator,
            clientFinalMessageWithoutProof
        ]);
        const clientSignature = HMAC(storedKey, authMessage, this.algorithm);
        const clientProof = XOR(clientKey, clientSignature).toString('base64');
        this.serverSignature = HMAC(serverKey, authMessage, this.algorithm);
        const result = platform_1.Buffer.concat([
            clientFinalMessageWithoutProof,
            platform_1.Buffer.from(`,p=${clientProof}`)
        ]);
        this.state = 'FINAL';
        this.cache = {
            clientKey,
            salt: this.salt,
            saltedPassword,
            serverKey
        };
        return result;
    }
}
exports.SCRAM = SCRAM;
