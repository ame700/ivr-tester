import { URL } from "url";
import { DtmfBufferGenerator } from "../call/dtmf/DtmfBufferGenerator";
import { TypedEmitter } from "../Emitter";
import { TestAssigner } from "./IteratingTestAssigner";
import { TestExecutor } from "./TestExecutor";
import { CallServer, CallServerEvents } from "./TwilioCallServer";
import { GenesysCall } from "../call/GenesysCall";
import { GeneSysAuth, IExtendedMediaSession, IPersonDetails, SubscriptionEvent } from "../call/Genesys";
import StreamingClient, { IClientOptions, ISessionInfo } from "genesys-cloud-streaming-client";
import { MediaStream , RTCPeerConnection , MediaStreamTrack} from "@roamhq/wrtc";
import { requestApiWithRetry } from "../http/HttpUtils";
const {  RTCAudioSource } = require('@roamhq/wrtc').nonstandard;

export class GenesysCallServer
  extends TypedEmitter<CallServerEvents>
  implements CallServer {
  private static TestCouldNotBeAssignedReason = "TestCouldNotBeAssigned";
 
  private _streamingConnection: StreamingClient;
 
  private peerConnection : RTCPeerConnection;
  private audioSource : any;

  private _personDetails: IPersonDetails;
  private _conversationId : string;

  constructor(
    private readonly dtmfBufferGenerator: DtmfBufferGenerator,
    private readonly testAssigner: TestAssigner,
    private readonly testExecutor: TestExecutor,
    private genesysAuth: GeneSysAuth) {
    super();
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
    this._streamingConnection.on('disconnected', this.closed); 
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

    //notification event
    this._streamingConnection.notifications.subscribe(`v2.users.${this._personDetails.id}.conversations`, 
      this.handleConversationUpdate.bind(this), true);

  }


  private onPropose(sessionInfo: ISessionInfo) : void {
    this._streamingConnection.webrtcSessions.acceptRtcSession(sessionInfo.sessionId);
  }

  private onSessionInit(session: IExtendedMediaSession) {
    this._conversationId = session.conversationId;
    this.audioSource = new RTCAudioSource();
    this.peerConnection = session.peerConnection;
    const track: MediaStreamTrack = this.audioSource.createTrack();
    this.peerConnection.getTransceivers()[0].direction = 'sendrecv';
    this.peerConnection.getSenders()[0].replaceTrack(track);
    this._streamingConnection.webrtcSessions.rtcSessionAccepted(session.id);
    session.on('terminated', this.onSessionTerminated.bind(this, session));
    session.accept();    
  }

  public fetchAuthenticatedUser(): Promise<IPersonDetails> {
    return requestApiWithRetry('/users/me?expand=station' , {} , this.genesysAuth).promise
      .then((data: any) => {
        return data.data;
      });
  }

  


  public async stop(): Promise<void> {
  }

  private callConnected(audioSinkConnection: RTCPeerConnection , audioSource: any  , participantId : string): void {
    const call = new GenesysCall(audioSinkConnection , audioSource , this.genesysAuth, this._conversationId , participantId);

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

  
    private handleConversationUpdate ( updateEvent: SubscriptionEvent){

      let participants = updateEvent.eventBody.participants;
      if(participants.length > 1) { 
          let _participantId = participants[0].id ; //first participant is the call initiator 

          // call connected when caller in state of dialing and callee in connected state
          if(participants[0].calls[0].state =='dialing'  && participants[1].calls[0].state == 'connected'){ 
            this.callConnected(this.peerConnection , this.audioSource , _participantId);
          }
          
          // call connected when caller in state of dialing and callee in connected state
          else if(participants[1].calls[0].state == 'terminated'){ 
            this.closed();
          }
      }

  }


}
