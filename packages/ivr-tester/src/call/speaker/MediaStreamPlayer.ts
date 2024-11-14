import { TwilioCall, WebSocketEvents } from "../TwilioCall";
import { TwilioConnectionEvents } from "../twilio";
import { TestSession } from "../../testRunner";
import Speaker from "speaker";
import { PassThrough, Stream } from "stream";
import { Config } from "../../configuration/Config";
import { IvrTesterPlugin } from "../../plugins/IvrTesterPlugin";
import { OutboundMediaObserver } from "../OutboundMediaObserver";
import { OutboundMediaSubject } from "../OutboundMediaSubject";
import { Call } from "../Call";

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
  
  export const mediaStreamPlayerPlugin = (config: Config): IvrTesterPlugin => {
    
  
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

  constructor(
    private readonly testSession: TestSession , private readonly config: PlayerConfig
) {

    if(this.config.enableSpeaker){
        this.processMessageRef = this.processMessage.bind(this);
        this.closeRef = this.close.bind(this);
        this.speaker = new Speaker({channels: 1,  bitDepth: 16, sampleRate: 8000});
        this.inboundMediaStream = new Stream.PassThrough();
        this.outbounddMediaStream = new Stream.PassThrough();
       
        this.inboundMediaStream.pipe(this.speaker);
        this.outbounddMediaStream.pipe(this.speaker);

        let call: Call= this.testSession.call;
        let tc : TwilioCall = call as TwilioCall;
        this.subject =  (<OutboundMediaSubject>tc);
        this.subject.registerObserver(this);
        
        const connection = call.getStream();
        connection
          .on(WebSocketEvents.Message, this.processMessageRef)
          .on(WebSocketEvents.Close, this.closeRef);
    }
    
  }

  private processMessage(message: string) {
    const data = JSON.parse(message);
    switch (data.event) {
      case TwilioConnectionEvents.Media:
        this.playAudioBufferForInboundMediaStream(Buffer.from(data.media.payload, "base64"));
        break;
    }
  }
  
  public observedMedia(media : Buffer , name : string) : void{
    if(!this.subject.ignoreMedia(name)){
      this.playAudioBufferForOutboundMediaStream(media);
    }
  }

 
  private playAudioBufferForInboundMediaStream(data: Buffer): void {
    setTimeout(() => {
      let pcmStream = alawmulaw.mulaw.decode(data);
      this.inboundMediaStream.write(pcmStream);
    }, 0);

  }


  private playAudioBufferForOutboundMediaStream(data: Buffer): void {
    setTimeout(() => {
      let pcmStream = alawmulaw.mulaw.decode(data);
      this.outbounddMediaStream.write(pcmStream);
    }, 0);

  }

  private close() {
    const connection = this.testSession.call.getStream();
    connection
      .off(WebSocketEvents.Message, this.processMessageRef)
      .off(WebSocketEvents.Close, this.closeRef);

    setTimeout(() => {
      this.speaker.close(true);
      this.inboundMediaStream.destroy();
      this.inboundMediaStream = null;
      this.outbounddMediaStream.destroy();
      this.outbounddMediaStream = null;
    }, delay);
  }
}
