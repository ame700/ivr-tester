
import { RetryPromise } from "genesys-cloud-streaming-client/dist/es/utils";
import { HttpClient, RequestApiOptions } from "genesys-cloud-streaming-client";
import { GeneSysAuth } from "../call/Genesys";

export function requestApiWithRetry(path: string, opts: Partial<RequestApiOptions> = {} , genesysAuth : GeneSysAuth): RetryPromise<any> {
    opts = buildRequestApiOptions(opts , genesysAuth);
    const request =  new HttpClient().requestApiWithRetry(path, opts as RequestApiOptions);
    request.promise.catch((e:any) => console.log("error: " + e));
    return request;
  };


export function buildRequestApiOptions(opts: Partial<RequestApiOptions> = {} , genesysAuth : GeneSysAuth): Partial<RequestApiOptions> {
    if (!opts.noAuthHeader) {
      opts.authToken = genesysAuth.authToken;
    }

    if (!opts.host) {
      opts.host = genesysAuth.env;
    }

    if (!opts.method) {
      opts.method = 'get';
    }

    return opts;
  }