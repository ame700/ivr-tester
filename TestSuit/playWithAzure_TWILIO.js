import 'dotenv/config.js';
import * as azureTranscripeModule from "ivr-tester-transcriber-azure-speech-to-text";
import { IvrTester , press, hangUp, say, containsSimilarTo } from "ivr-tester";
import { CallingServiceType } from "ivr-tester";


const config = {
  localServerPort: process.env.LOCAL_SERVER_PORT,
  publicServerUrl: process.env.PUBLIC_SERVER_URL,
  twilioAuth: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
  
  transcriber: azureTranscripeModule.azureSpeechToText({
    speechKey: process.env.AZURE_KEY,
    callingServiceType : CallingServiceType.TWILIO
  }),
  synthesizer: azureTranscripeModule.azureTextToSpeech({
    speechKey: process.env.AZURE_KEY,
    voiceName: "en-US-AndrewMultilingualNeural",
    callingServiceType : CallingServiceType.TWILIO
  }),
  playThroughSpeaker: false
}


new IvrTester(config).run(
  { from: "+12342318115", to: "+971543306217" },

  {
    name: "Welcome to our IVR Engine Demo",
    steps: [
      {
        whenPrompt: containsSimilarTo("hello"),
        then: press("1"),
        silenceAfterPrompt: 500,
        timeout: 6000,
      },
      {
        whenPrompt: containsSimilarTo("talk to me"),
        then: say("welcome to our ivr testing and montoring engine"),
        silenceAfterPrompt: 500,
        timeout: 6000,
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
