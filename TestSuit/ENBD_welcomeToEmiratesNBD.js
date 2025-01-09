import 'dotenv/config.js';
import * as azureTranscripeModule from "ivr-tester-transcriber-azure-speech-to-text";
import {IvrTester ,similarTo , press , hangUp  } from "ivr-tester";


const config ={
  localServerPort: process.env.LOCAL_SERVER_PORT,
  publicServerUrl: process.env.PUBLIC_SERVER_URL,
  twilioAuth: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
  transcriber: azureTranscripeModule.azureSpeechToText({
    speechKey: process.env.AZURE_KEY,
    speechRegion:"eastus"
  }),
  synthesizer: azureTranscripeModule.azureTextToSpeech({
    speechKey: process.env.AZURE_KEY,
    speechRegion:"eastus",
    voiceName: "en-US-AndrewMultilingualNeural"
  }),
  playThroughSpeaker: false
}

new IvrTester(config).run(
  { from: "+12342318115", to: "+971600540000"}, 
  {
    name: "Emirates NBD Welcome Message",
    steps: [
      {
        whenPrompt: similarTo("welcome to emirates nbd"),
        then: hangUp(),
        silenceAfterPrompt: 500,
        timeout: 5000,
      }
     ],
  }
);
