import { TranscriberFactory } from "ivr-tester";
import { SynthesizerFactory } from "ivr-tester";
import { AzureSpeechToText } from "./AzureSpeechToText";
import { AzureTextToSpeech } from "./AzureTextToSpeech";
import { CallingServiceType } from "ivr-tester";

export interface AzureSpeechToTextOptions {

    speechKey: string;

    speechRegion: string;

    callingServiceType : CallingServiceType;
}

export interface AzureTextToSpeechOptions {

    speechKey: string;

    speechRegion: string;
    
    voiceName: string;
    
    callingServiceType : CallingServiceType;
}

/**
 * Factory for creating a Azure Speech-to-Text transcriber plugin that is preconfigured for
 * phone-calls - specifically 8-bit PCM mono uLaw with a sampling rate of 8Khz.
 */
export const azureSpeechToText = (
    {
        speechKey,
        speechRegion = "eastus",
        callingServiceType
    }: AzureSpeechToTextOptions
): TranscriberFactory => ({
    create: () =>
        new AzureSpeechToText(
            speechKey,
            speechRegion,
            callingServiceType
        ),
    checkCanRun: async () => {
        try {
            return { canRun: true };
        } catch (error) {
            return {
                canRun: false,
                reason: `Cannot find Azure Speech-to-Text credentials:\n${error.message}`,
            };
        }

        return { canRun: true };
    },
});

export const azureTextToSpeech = (
    {
        speechKey,
        speechRegion = "eastus",
        voiceName = "en-US-AvaMultilingualNeural",
        callingServiceType 
    }: AzureTextToSpeechOptions
): SynthesizerFactory => ({
    create: () =>
        new AzureTextToSpeech(
            speechKey,
            speechRegion,
            voiceName,
            callingServiceType
        ),
    checkCanRun: async () => {
        try {
            return { canRun: true };
        } catch (error) {
            return {
                canRun: false,
                reason: `Cannot find Azure Speech-to-Text credentials:\n${error.message}`,
            };
        }
    },
});

export default azureSpeechToText;

