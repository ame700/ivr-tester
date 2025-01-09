import { TwilioCall, WebSocketEvents } from "../TwilioCall";
import { TwilioConnectionEvents } from "../twilio";
import { TestSession } from "../../testRunner";
import Speaker from "speaker";
import { PassThrough, Stream } from "stream";
import { Config } from "../../configuration/Config";
import { IvrTesterPlugin } from "../../plugins/IvrTesterPlugin";
import { OutboundMediaObserver } from "../OutboundMediaObserver";
import { OutboundMediaSubject } from "../OutboundMediaSubject";
import { Call, CallingServiceType } from "../Call";
import { GenesysConfig } from "../../configuration/GenesysConfig";
import { GenesysCall } from "../GenesysCall";
import ws from "ws";
import { RTCPeerConnection } from "@roamhq/wrtc";
import { RTCRtpReceiver } from '@roamhq/wrtc';
const { RTCAudioSink } = require('@roamhq/wrtc').nonstandard;

const alawmulaw = require('alawmulaw');


const getArgs = (): any=>
  process.argv.reduce((args: any, arg) => {
    // long arg
    if (arg.slice(0, 2) === "--") {
      const longArg = arg.split("=");
      const longArgFlag = longArg[0].slice(2);
      const longArgValue = longArg.length > 1 ? longArg[1] : true;
      args[longArgFlag] = longArgValue;
    }
    return args;
  }, {});
  
let delay = (getArgs().logDelay) || 0 ;


export interface PlayerConfig {
    enableSpeaker: boolean;
  }
  
  export const mediaStreamPlayerPlugin = (config: Config | GenesysConfig): IvrTesterPlugin => {
    
  
    const playerConfig: PlayerConfig = {
       enableSpeaker: config.playThroughSpeaker,
    };
  
    return {
      initialise(): void {
        // Intentionally empty
      },
      testStarted(testSession): void {
        new MediaStreamPlayer(testSession, playerConfig);
      },
    };
  };

export class MediaStreamPlayer implements OutboundMediaObserver {

  private readonly processMessageRef: (message: string) => void;
  private readonly closeRef: () => void;

  private speaker: Speaker;
  private inboundMediaStream: PassThrough;
  private outbounddMediaStream: PassThrough;
  private subject : OutboundMediaSubject;
  private call : Call;

  constructor(private readonly testSession: TestSession,
    private readonly config: PlayerConfig) {

    if (this.config.enableSpeaker) {
      this.processMessageRef = this.processMessage.bind(this);
      this.closeRef = this.close.bind(this);
      
      this.call = this.testSession.call;

      this.speaker = this.exec(()=>{return new Speaker({ channels: 1, bitDepth: 16, sampleRate: 8000 });}
      ,()=>{return new Speaker({ channels: 1, bitDepth: 16, sampleRate: 48000 });})

      this.inboundMediaStream = new Stream.PassThrough();
      this.outbounddMediaStream = new Stream.PassThrough();

      this.inboundMediaStream.pipe(this.speaker);
      this.outbounddMediaStream.pipe(this.speaker);

      let childCall = (this.isTwilio()) ? (this.call as TwilioCall) : (this.call as GenesysCall);
      this.subject = (<OutboundMediaSubject>childCall);
      this.subject.registerObserver(this);

      this.exec(() => {
        const connection: ws = this.call.getStream();
        connection
          .on(WebSocketEvents.Message, this.processMessageRef)
          .on(WebSocketEvents.Close, this.closeRef);
      }, () => {
        const connection: RTCPeerConnection = this.call.getStream();
        const receiverWithActiveAudioTrack: RTCRtpReceiver = connection.getReceivers().find((r: any) => r.track?.kind === 'audio');
        const audioSink: any = new RTCAudioSink(receiverWithActiveAudioTrack.track);
        audioSink.addEventListener('data', (data: any) => {
          this.playAudioBuffer(data.samples , this.inboundMediaStream);
        });
        this.call.on("callClosed", ()=>{
          audioSink.stop()
          this.closeStreams();
        });
      })
    }
  }

  private processMessage(message: string) {
    const data = JSON.parse(message);
    switch (data.event) {
      case TwilioConnectionEvents.Media:
        this.playAudioBuffer(Buffer.from(data.media.payload, "base64") , this.inboundMediaStream);
        break;
    }
  }
  
  public observedMedia(media : Buffer | ArrayBuffer , name : string) : void{
    if(!this.subject.ignoreMedia(name)){
      this.playAudioBuffer(media , this.outbounddMediaStream);
    }
  }

 
  private playAudioBuffer(data: Buffer | ArrayBuffer , stream : PassThrough): void {
    setTimeout(() => {
      if(this.isTwilio()){
        data = alawmulaw.mulaw.decode(data);
      }
      stream.write(data);
    }, 0);

  }


  private close() {
    const connection = this.testSession.call.getStream();
    connection
      .off(WebSocketEvents.Message, this.processMessageRef)
      .off(WebSocketEvents.Close, this.closeRef);
    this.closeStreams();
  }


  private closeStreams():void {
    setTimeout(() => {
      this.speaker.close(true);
      this.inboundMediaStream.destroy();
      this.inboundMediaStream = null;
      this.outbounddMediaStream.destroy();
      this.outbounddMediaStream = null;
    }, delay);
  }


  private exec(twilioCallback: any, genesysCallBack: any): any {
    if (this.isTwilio()) {
      return twilioCallback();
    }
    else {
      return genesysCallBack();
    }
  }

  private isTwilio(): boolean {
    return this.call.callingServiceImpl() == CallingServiceType.TWILIO;
  }
}
