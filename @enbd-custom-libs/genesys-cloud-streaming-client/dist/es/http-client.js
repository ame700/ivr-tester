import axios, { AxiosError } from 'axios';
import { retryPromise } from './utils';
const correlationIdHeaderName = 'inin-correlation-id';
export class HttpClient {
    constructor() {
        this._httpRetryingRequests = new Map();
    }
    requestApiWithRetry(path, opts, retryInterval) {
        const retry = retryPromise(this.requestApi.bind(this, path, opts), (error) => {
            var _a, _b, _c;
            let retryValue = false;
            if (error === null || error === void 0 ? void 0 : error.response) {
                retryValue = HttpClient.retryStatusCodes.has(error.response.status || 0);
                // This *should* be an axios error according to typings, but it appears this could be an AxiosError *or* and XmlHttpRequest
                // we'll check both to be safe
                const retryAfter = ((_a = error.response.headers) === null || _a === void 0 ? void 0 : _a['retry-after']) || ((_c = (_b = error.response).getResponseHeader) === null || _c === void 0 ? void 0 : _c.call(_b, 'retry-after'));
                if (retryAfter) {
                    (opts.logger || console).debug('retry-after header found on response. setting retry delay', { retryAfter });
                    // retry after comes in seconds, we need to return milliseconds
                    retryValue = parseInt(retryAfter, 10) * 1000;
                }
            }
            return retryValue;
        }, retryInterval, opts.logger);
        this._httpRetryingRequests.set(retry._id, retry);
        /* tslint:disable:no-floating-promises */
        retry.promise.then(() => this.cancelRetryRequest(retry._id), () => this.cancelRetryRequest(retry._id));
        return retry;
    }
    requestApi(path, opts) {
        const logger = opts.logger || console;
        const start = new Date().getTime();
        const url = this._buildUri(opts.host, path, opts.version);
        const headers = Object.assign({ 'content-type': opts.contentType || 'application/json' }, (opts.customHeaders || {}));
        const params = {
            method: opts.method,
            url,
            data: opts.data,
            responseType: opts.responseType,
            timeout: opts.requestTimeout || 30000,
            headers
        };
        // default to include auth header
        if (!opts.noAuthHeader) {
            params.headers['Authorization'] = `Bearer ${opts.authToken}`;
        }
        const boundHandler = this.handleResponse.bind(this, logger, start, params);
        return axios(params)
            .then(boundHandler, boundHandler);
    }
    handleResponse(logger, start, params, res) {
        var _a, _b, _c;
        let now = new Date().getTime();
        let elapsed = (now - start) + 'ms';
        if (res instanceof AxiosError) {
            // sanitize the auth token
            if ((_b = (_a = res.config) === null || _a === void 0 ? void 0 : _a.headers) === null || _b === void 0 ? void 0 : _b.Authorization) {
                res.config.headers.Authorization = 'redacted';
            }
            // handles request timeout
            if (res.code === 'ECONNABORTED') {
                logger.debug(`request error: ${params.url}`, {
                    message: res.message,
                    now,
                    elapsed
                }, { skipServer: true });
                return Promise.reject(res);
            }
            /* istanbul ignore next */
            const response = res.response || {};
            let status = response.status;
            let correlationId = response.headers && response.headers[correlationIdHeaderName];
            let body = response.data;
            let error = Object.assign(Object.assign({}, res), { text: (_c = response.request) === null || _c === void 0 ? void 0 : _c.response });
            logger.debug(`request error: ${params.url}`, {
                message: res.message,
                now,
                elapsed,
                status,
                correlationId,
                body
            }, { skipServer: true });
            return Promise.reject(error);
        }
        let status = res.status;
        let correlationId = res.headers[correlationIdHeaderName];
        let body = JSON.stringify(res.data);
        logger.debug(`response: ${params.method.toUpperCase()} ${params.url}`, {
            now,
            status,
            elapsed,
            correlationId,
            body
        }, { skipServer: true });
        return Promise.resolve(res);
    }
    stopAllRetries() {
        Array.from(this._httpRetryingRequests.keys())
            .forEach(key => this.cancelRetryRequest(key));
    }
    cancelRetryRequest(retryId) {
        const value = this._httpRetryingRequests.get(retryId);
        if (value) {
            /* if the promise has already completed, this will do nothing. Still need to remove it from the map */
            value.cancel(new Error('Retry request cancelled'));
            this._httpRetryingRequests.delete(retryId);
        }
        return true;
    }
    formatRequestError(error) {
        /* if network error */
        if (this.isSuperagentNetworkError(error)) {
            return {
                status: error.status,
                method: error.method,
                url: error.url,
                crossDomain: error.crossDomain,
                message: error.message,
                name: error.name,
                stack: error.stack
            };
        }
        /* if superagent response error */
        if (this.isSuperagentResponseError(error)) {
            const res = error.response;
            return {
                status: error.status,
                correlationId: res.headers['inin-correlation-id'],
                // Potentially could contain PII
                // responseBody: res.text,
                // requestBody: res.req._data,
                // url: res.error.url,
                message: 'Error making HTTP request',
                method: res.req.method,
                name: res.error.name,
                stack: res.error.stack
            };
        }
        /* if we don't have a superagent error */
        return error;
    }
    isSuperagentNetworkError(error) {
        return (error &&
            // these properties may have the value of `undefined` but they will still be set
            error.hasOwnProperty('status') &&
            error.hasOwnProperty('method') &&
            error.hasOwnProperty('url'));
    }
    isSuperagentResponseError(error) {
        return !!(error &&
            error.response &&
            error.response.body &&
            error.response.req);
    }
    _buildUri(host, path, version = 'v2') {
        path = path.replace(/^\/+|\/+$/g, ''); // trim leading/trailing /
        if (host.indexOf('http') === 0) {
            return `${host}/api/${version}/${path}`;
        }
        return `https://api.${host}/api/${version}/${path}`;
    }
}
HttpClient.retryStatusCodes = new Set([
    408,
    413,
    429,
    500,
    502,
    503,
    504
]);
