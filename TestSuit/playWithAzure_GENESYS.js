import 'dotenv/config.js';
import * as azureTranscripeModule from "ivr-tester-transcriber-azure-speech-to-text";
import { IvrGenesysTester, press, hangUp, say, containsSimilarTo, CallingServiceType} from "ivr-tester";


const config = {
  genesysAuth: {
    env : process.env.GENESYS_ENV,
    authToken : process.env.GENESYS_TOKEN
  },
  transcriber: azureTranscripeModule.azureSpeechToText({
    speechKey: process.env.AZURE_KEY,
    callingServiceType : CallingServiceType.GENESYS
  }),
  synthesizer: azureTranscripeModule.azureTextToSpeech({
    speechKey: process.env.AZURE_KEY,
    voiceName: "en-US-AndrewMultilingualNeural",
    callingServiceType : CallingServiceType.GENESYS
  }),

  playThroughSpeaker: false
}


new IvrGenesysTester(config).run(
  {  to: "+971543306217" },

  {
    name: "Welcome to our IVR Engine Demo",
    steps: [
      {
        whenPrompt: containsSimilarTo("hello"),
        then: press("123456"),
        silenceAfterPrompt: 500,
        timeout: 20000,
      },
      {
        whenPrompt: containsSimilarTo("talk to me"),
        then: say("Welcome to our ivr testing and montoring engine."),
        silenceAfterPrompt: 1000,
        timeout: 20000,
      },
      { 
        whenPrompt: containsSimilarTo("bye bye"),
        then: hangUp(),
        silenceAfterPrompt: 500,
        timeout: 6000,
      },
    ],
  }
);
