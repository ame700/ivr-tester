import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import {
    TranscriberPlugin,
    TranscriptEvent,
    TranscriptionEvents,
    TypedEmitter,
} from "ivr-tester";
import { Debugger } from "./Debugger";
import { MulawToPcm } from "./MulawToPCM";



export class AzureSpeechToText
    extends TypedEmitter<TranscriptionEvents>
    implements TranscriberPlugin {

    private static readonly debug = Debugger.getPackageDebugger();
    private stream: sdk.PushAudioInputStream;
    private readonly speechConfig;
    private speechRecognizer; 

    constructor(
        speechKey: string,
        speechRegion: string,
    ) {
        super();
        this.speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
      //  this.speechConfig.speechRecognitionLanguage = "ar-AE";
        this.stream = sdk.AudioInputStream.createPushStream(sdk.AudioStreamFormat.getWaveFormatPCM(8000,16,1));
        let audioConfig = sdk.AudioConfig.fromStreamInput(this.stream);
        this.speechRecognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig);
        this.speechRecognizer.recognizing = (sender , evnt) => {
            const event: TranscriptEvent = {
                transcription: evnt.result.text.trim(),
                isFinal: false,
            };
            AzureSpeechToText.debug("Emitted: %O", event);
            this.emit("transcription", event);
        }
        this.speechRecognizer.startContinuousRecognitionAsync();

    }

    public transcribe(payload: Buffer): void {
        this.stream.write(MulawToPcm.transcode(payload));
    }
      
    public close(): void {

        if (this.stream) {
            this.stream.close();
            this.stream = null;
            this.speechRecognizer.close();

            AzureSpeechToText.debug("Stream destroyed");
        }
    }

    public transcriptionComplete(): void {
        this.close();
    }
}
