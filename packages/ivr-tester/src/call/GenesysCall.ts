import ws from "ws";
import { DtmfBufferGenerator } from "./dtmf/DtmfBufferGenerator";
import { TwilioConnectionEvents } from "./twilio";
import { Call, CallEvents, CallingServiceType } from "./Call";
import { Debugger } from "../Debugger";
import { TypedEmitter } from "../Emitter";
import { OutboundMediaSubject } from "./OutboundMediaSubject";
import { OutboundMediaObserver } from "./OutboundMediaObserver";
import { RTCPeerConnection , MediaStreamTrack } from "@roamhq/wrtc";
import { requestApiWithRetry } from "../http/HttpUtils";
import { GeneSysAuth } from "./Genesys";
const { RTCAudioSink , RTCAudioSource} = require('@roamhq/wrtc').nonstandard;


const SAMPLE_RATE = 48000;
const SLIC_SIZE = SAMPLE_RATE / 50; //gives us 10 ms chunks

export class GenesysCall extends TypedEmitter<CallEvents> implements Call , OutboundMediaSubject{
  private static debug = Debugger.getGenesysDebugger();
  private outboundMediaObserversList : OutboundMediaObserver[]; 
  private audioSink;


  constructor(
    private readonly peerConnection: RTCPeerConnection,
    private readonly audioSource : any,
    private genesysAuth: GeneSysAuth,
    private readonly _conversationId : string,
    private readonly _participantId : string
  ) {
    super();
    this.outboundMediaObserversList = []; 
    const receiverWithActiveAudioTrack: any = peerConnection.getReceivers().find((r: any) => r.track?.kind === 'audio');
    this.audioSink = new RTCAudioSink(receiverWithActiveAudioTrack.track);
  }

  public close(reason: string): void {
    this.closeConnection();
    this.emit("callClosed", { by: "ivr-tester", reason });
  }

  public isOpen(): boolean {
    return !this.audioSink.stopped;
  }


  private closeConnection(): void {
    if (this.isOpen()) {
      this.audioSink.stop();
      this.peerConnection.close();
    }
  }

  public sendDtmfTone(dtmfSequence: string): void {
    this.doSendDtmfWithDelay(dtmfSequence , 2000);
    GenesysCall.debug(`DTMF tone for ${dtmfSequence} sent`);
  }

  private async doSendDtmfWithDelay(dtmfSequence: string , delay: number) : Promise<any> {
    let digits = dtmfSequence.split(""); 
    for ( let i =0 ; i <digits.length ; i ++) {
        requestApiWithRetry(`/conversations/${this._conversationId}/participants/${this._participantId}/digits`, {
          method: 'post',
          data: {digits: digits[i]}
        }, this.genesysAuth);
        await this.sleep(delay);
    };
  }

  private sleep(ms:number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  public sendMedia(payload : Buffer, name?: string): void {
    if (!this.isOpen()) {
      throw new Error("Media cannot be sent as call has been closed");
    }
    let payloadArrayBuffer = payload.buffer;
    let interval = setInterval(() => {
      if (payloadArrayBuffer.byteLength >= SLIC_SIZE) {
          let sampleSlice = payloadArrayBuffer.slice(0, SLIC_SIZE);
          payloadArrayBuffer = payloadArrayBuffer.slice(SLIC_SIZE);
          this.audioSource.onData({ samples: sampleSlice, sampleRate: SAMPLE_RATE, bitsPerSample: 16, channelCount: 1 });
      }else{
        clearInterval(interval);
      }
    }, 10);

    this.notifyAllObservers(payload , name);
  }


  public getStream(): RTCPeerConnection {
    return this.peerConnection;
  }

  public registerObserver(observer: OutboundMediaObserver): void {
    this.outboundMediaObserversList.push(observer);
  }

  public notifyAllObservers(media : Buffer, name : string): void {
    this.outboundMediaObserversList.forEach(obs => obs.observedMedia(media , name))
  }
  
  public ignoreMedia(name : string) : boolean{
    if(!name)
      return false;
    if(name && name.substring(5).length <= 1)
      return false; 
    
    return true;
  }
  
  public callingServiceImpl () : CallingServiceType{
    return CallingServiceType.GENESYS;
  }

}
