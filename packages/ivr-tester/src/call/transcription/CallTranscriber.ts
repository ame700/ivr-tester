import { WebSocketEvents } from "../TwilioCall";
import { TwilioConnectionEvents } from "../twilio";
import {
  TranscriberPlugin,
  TranscriptEvent,
  TranscriptionEvents,
} from "./plugin/TranscriberPlugin";
import { Debugger } from "../../Debugger";
import { TypedEmitter } from "../../Emitter";
import { Call, CallingServiceType } from "../Call";
import { RTCPeerConnection } from "@roamhq/wrtc";
import { RTCRtpReceiver } from '@roamhq/wrtc';
const { RTCAudioSink } = require('@roamhq/wrtc').nonstandard;

export class CallTranscriber extends TypedEmitter<TranscriptionEvents> {
  private static debug = Debugger.getPackageDebugger();

  private readonly processMessageRef: (message: string) => void;
  private readonly closeRef: () => void;

  constructor(
    private readonly call: Call,
    private readonly transcriber: TranscriberPlugin
  ) {
    super();
    this.processMessageRef = this.processMessage.bind(this);
    this.closeRef = this.close.bind(this);
    
    this.exec(call , ()=>{
        call.getStream()
        .on(WebSocketEvents.Message, this.processMessageRef)
        .on(WebSocketEvents.Close, this.closeRef);
      },()=>{
        const connection: RTCPeerConnection = call.getStream();
        const receiverWithActiveAudioTrack: RTCRtpReceiver = connection.getReceivers().find((r: any) => r.track?.kind === 'audio');
        const audioSink: any = new RTCAudioSink(receiverWithActiveAudioTrack.track);
        audioSink.addEventListener('data', (data: any) => {
          this.processMessageGenesys(data.samples)
        });
        call.on("callClosed", ()=>{
          audioSink.stop()
        });
    })
   
    transcriber.on("transcription", this.collects.bind(this));
  }

  private processMessage(message: string) {
    const data = JSON.parse(message);
    switch (data.event) {
      case TwilioConnectionEvents.Media:
        this.transcriber.transcribe(Buffer.from(data.media.payload, "base64"));
        break;
    }
  }

  private processMessageGenesys(data : Buffer) {
    this.transcriber.transcribe(data);
  }


  private close() {
    this.exec(this.call,()=>{
      this.call
      .getStream()
      .off(WebSocketEvents.Message, this.processMessageRef)
      .off(WebSocketEvents.Close, this.closeRef);
    },()=>{
      
    })

    this.transcriber.close();
  }

  private collects(event: TranscriptEvent) {
    CallTranscriber.debug("Transcript: %s", event.transcription);
    this.emit("transcription", event);
  }

  private exec(call: Call, twilioCallback: any, genesysCallBack: any): any {
    if (this.isTwilio(call)) {
      return twilioCallback();
    }
    else {
      return genesysCallBack();
    }
  }

  private isTwilio(call: Call): boolean {
    return call.callingServiceImpl() == CallingServiceType.TWILIO;
  }
}
