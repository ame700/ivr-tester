import { URL } from "url";
import { DtmfBufferGenerator } from "../call/dtmf/DtmfBufferGenerator";
import { TypedEmitter } from "../Emitter";
import { TestAssigner } from "./IteratingTestAssigner";
import { TestExecutor } from "./TestExecutor";
import { CallServer, CallServerEvents } from "./TwilioCallServer";
import { GenesysCall } from "../call/GenesysCall";
import { RetryPromise } from "genesys-cloud-streaming-client/dist/es/utils";
import { GeneSysAuth, IExtendedMediaSession, IPersonDetails } from "../call/Genesys";
import StreamingClient, { HttpClient, IClientOptions, IPendingSession, ISessionInfo, RequestApiOptions } from "genesys-cloud-streaming-client";
import { MediaStream , RTCPeerConnection , MediaStreamTrack} from "@roamhq/wrtc";
const {  RTCAudioSource } = require('@roamhq/wrtc').nonstandard;

export class GenesysCallServer
  extends TypedEmitter<CallServerEvents>
  implements CallServer {
  private static TestCouldNotBeAssignedReason = "TestCouldNotBeAssigned";
  private _http: HttpClient;
  private _streamingConnection: StreamingClient;
  private _personDetails: IPersonDetails;

  constructor(
    private readonly dtmfBufferGenerator: DtmfBufferGenerator,
    private readonly testAssigner: TestAssigner,
    private readonly testExecutor: TestExecutor,
    private genesysAuth: GeneSysAuth) {
    super();
    this._http = new HttpClient();
  }


  public async listen(port: number): Promise<URL> {

    this._personDetails = await this.fetchAuthenticatedUser();
    let localUrl: URL = await this.setupStreamingClient();
    this.setupProxyStreamingClient();
    return Promise.resolve(localUrl);
  }

  private async setupStreamingClient(): Promise<URL> {
    const connectionOptions: IClientOptions = {
      signalIceConnected: true,
      host: `wss://streaming.${this.genesysAuth.env}`,
      apiHost: this.genesysAuth.env,
      appName: 'webrtc-demo-POC',
      appVersion: '1.0.0',
      appId: '0cff89d4-256c-40e2-a9f4-2d80e938daae',
      optOutOfWebrtcStatsTelemetry: false,
      useServerSidePings: false,
      authToken: this.genesysAuth.authToken,
    };

    if (this._personDetails) {
      connectionOptions.jid = this._personDetails.chat.jabberId;
    }

    this._streamingConnection = new StreamingClient(connectionOptions);
    this._streamingConnection.on('connected', async () => { this.emit("listening", { localUrl : new URL(connectionOptions.host) })});
    this._streamingConnection.on('disconnected', this.closed); //stopped
    await this._streamingConnection.connect({ maxConnectionAttempts: Infinity });
    return Promise.resolve(new URL(connectionOptions.host));
  }


  private setupProxyStreamingClient(): void {
    // webrtc events
    const on = this._streamingConnection.webrtcSessions.on.bind(this._streamingConnection);
    on('requestIncomingRtcSession', this.onPropose.bind(this));
    on('incomingRtcSession', this.onSessionInit.bind(this));
    on('rtcSessionError', (err: any) => { console.log(err) }); //error
    // other events
    this._streamingConnection.on('error', (err: any) => { console.log(err) }); //error
  }


  private onPropose(sessionInfo: ISessionInfo) : void {
    this._streamingConnection.webrtcSessions.acceptRtcSession(sessionInfo.sessionId);
  }

  private onSessionInit(session: IExtendedMediaSession) {
    let audioSource = new RTCAudioSource();
    const track: MediaStreamTrack = audioSource.createTrack();
    session.peerConnection.getTransceivers()[0].direction = 'sendrecv';
    session.peerConnection.getSenders()[0].replaceTrack(track);
    this._streamingConnection.webrtcSessions.rtcSessionAccepted(session.id);
    session.on('terminated', this.onSessionTerminated.bind(this, session));
    session.accept().then(()=>{
      this.callConnected(session.peerConnection , audioSource);
    });
  }

  public fetchAuthenticatedUser(): Promise<IPersonDetails> {
    return this.requestApiWithRetry('/users/me?expand=station').promise
      .then((data: any) => {
        return data.data;
      });
  }

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

  private requestApiWithRetry(path: string, opts: Partial<RequestApiOptions> = {}): RetryPromise<any> {
    opts = this.buildRequestApiOptions(opts);
    const request = this._http.requestApiWithRetry(path, opts as RequestApiOptions);
    request.promise.catch(e => console.log("error" + e));
    return request;
  };


  public async stop(): Promise<void> {
  }

  private callConnected(audioSinkConnection: RTCPeerConnection , audioSource: any ): void {
    const call = new GenesysCall(audioSinkConnection , audioSource, this.dtmfBufferGenerator);

    this.emit("callConnected", { call });

    const result = this.testAssigner.assign();
    if (result.isAssigned === true) {
      const testSession = this.testExecutor.startTest(result.scenario, call);
      this.emit("testStarted", { testSession });
    } else {
      call.close(GenesysCallServer.TestCouldNotBeAssignedReason);
    }
  }

  private closed(): void {
    this.emit("stopped", undefined);
  }

  private serverError(error: Error): void {
    this.emit("error", { error });
  }

  private onSessionTerminated(session: IExtendedMediaSession) {
    let streamOrTrack = session._outboundStream;
    if (!streamOrTrack) return;
    let tracks = (streamOrTrack instanceof MediaStream) ? streamOrTrack.getTracks() : [streamOrTrack];
    tracks.forEach((t: any) => t.stop());
    this.closed();
  }


}
