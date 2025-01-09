import { Debugger } from "../Debugger";
import { Caller, RequestedCall } from "./Caller";
import { GenesysNumber } from "../configuration/call/GenesysNumber";
import { GeneSysAuth, IPersonDetails, IStartSoftphoneSessionParams } from "./genesys";
import { HttpClient, RequestApiOptions, SessionTypes } from "genesys-cloud-streaming-client";
import { RetryPromise } from "genesys-cloud-streaming-client/dist/es/utils";


export class GenesysCaller implements Caller<GenesysNumber> {
  private static debug = Debugger.getGenesysDebugger();
  private _http: HttpClient;

  constructor(private genesysAuth: GeneSysAuth) {
    this._http = new HttpClient();
  }


 private async startSession(params: IStartSoftphoneSessionParams): Promise<{ id: string, selfUri: string }> {
    const response: any = this.requestApiWithRetry(`/conversations/calls`, {
      method: 'post',
      data: JSON.stringify(params)
    });
    return { id: response.data?.id, selfUri: response.data?.selfUri };
  }

  private requestApiWithRetry(path: string, opts: Partial<RequestApiOptions> = {}): RetryPromise<any> {
    opts = this.buildRequestApiOptions(opts);
    const request = this._http.requestApiWithRetry(path, opts as RequestApiOptions);
    request.promise.catch(e => console.log("error" + e));
    return request;
  };


  private buildRequestApiOptions(opts: Partial<RequestApiOptions> = {}): Partial<RequestApiOptions> {
    if (!opts.noAuthHeader) {
      opts.authToken = this.genesysAuth.authToken;
    }

    if (!opts.host) {
      opts.host = this.genesysAuth.env;
    }

    if (!opts.method) {
      opts.method = 'get';
    }

    return opts;
  }

  public async call(
    call: GenesysNumber
  ): Promise<RequestedCall> {

    await this.startSession({ phoneNumber: call.to, sessionType: SessionTypes.softphone });
    return { type: "genesys-telephony", call };
  }
}
