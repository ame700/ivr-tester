import { Debugger } from "../Debugger";
import { Caller, RequestedCall } from "./Caller";
import { GenesysNumber } from "../configuration/call/GenesysNumber";
import { GeneSysAuth, IStartSoftphoneSessionParams } from "./Genesys";
import { HttpClient, SessionTypes } from "genesys-cloud-streaming-client";
import { requestApiWithRetry } from "../http/HttpUtils";


export class GenesysCaller implements Caller<GenesysNumber> {
  private static debug = Debugger.getGenesysDebugger();
  private _http: HttpClient;

  constructor(private genesysAuth: GeneSysAuth) {
    this._http = new HttpClient();
  }


 private async startSession(params: IStartSoftphoneSessionParams) {
    const response: any = requestApiWithRetry(`/conversations/calls`, {
      method: 'post',
      data: JSON.stringify(params)
    },this.genesysAuth);
  }

  public async call(
    call: GenesysNumber
  ): Promise<RequestedCall> {
    await this.startSession({ phoneNumber: call.to, sessionType: SessionTypes.softphone });
    return { type: "genesys-telephony", call };
  }
}
