import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import {
    SynthesizeEvents,
    SynthesizerPlugin,
    TypedEmitter,
} from "ivr-tester";
import { Debugger } from "./Debugger";
const alawmulaw = require('alawmulaw');



export class AzureTextToSpeech
    extends TypedEmitter<SynthesizeEvents>
    implements SynthesizerPlugin {

    private static readonly debug = Debugger.getPackageDebugger();
    private speechSynthesizer: sdk.SpeechSynthesizer;

    constructor(speechKey: string, speechRegion: string, voiceName: string) {
        super();
        let speechConfig = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw8Khz8BitMonoMULaw;
        speechConfig.speechSynthesisVoiceName = voiceName;
        this.speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
    }

    synthesize(text: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.speechSynthesizer.speakTextAsync(text,
                result => {
                    resolve(Buffer.from(result.audioData));
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
