import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import {
    SynthesizeEvents,
    SynthesizerPlugin,
    TypedEmitter,
} from "ivr-tester";
import { Debugger } from "./Debugger";
import { CallingServiceType } from "ivr-tester";
const alawmulaw = require('alawmulaw');



export class AzureTextToSpeech
    extends TypedEmitter<SynthesizeEvents>
    implements SynthesizerPlugin {

    private static readonly debug = Debugger.getPackageDebugger();
    private speechSynthesizer: sdk.SpeechSynthesizer;
    private callingServiceType: CallingServiceType;

    constructor(speechKey: string, speechRegion: string, voiceName: string , callingServiceType: CallingServiceType) {
        super();
        this.callingServiceType = callingServiceType;
        let speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechSynthesisOutputFormat = (callingServiceType == CallingServiceType.TWILIO)? (sdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw):(sdk.SpeechSynthesisOutputFormat.Raw48Khz16BitMonoPcm);
        speechConfig.speechSynthesisVoiceName = voiceName;
        this.speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
    }

    synthesize(text: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.speechSynthesizer.speakTextAsync(text,
                result => {
                    if(result && result.audioData){
                      resolve(Buffer.from(result.audioData));
                    }
                },
                error => {
                    reject(error);
                });
        });
    }


    close(): void {
        this.speechSynthesizer.close();
    }

}
