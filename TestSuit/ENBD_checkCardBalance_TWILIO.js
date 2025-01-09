import 'dotenv/config.js';
import * as azureTranscripeModule from "ivr-tester-transcriber-azure-speech-to-text";
import {IvrTester , press , hangUp, containsSimilarTo ,CallingServiceType, doNothing, say  } from "ivr-tester";


const config ={
  localServerPort: process.env.LOCAL_SERVER_PORT,
  publicServerUrl: process.env.PUBLIC_SERVER_URL,
  twilioAuth: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
  transcriber: azureTranscripeModule.azureSpeechToText({
    speechKey: process.env.AZURE_KEY,
    speechRegion:"eastus",
    callingServiceType : CallingServiceType.TWILIO

  }),
  synthesizer: azureTranscripeModule.azureTextToSpeech({
    speechKey: process.env.AZURE_KEY,
    speechRegion:"eastus",
    voiceName: "en-US-AndrewMultilingualNeural",
    callingServiceType : CallingServiceType.TWILIO
  }),
  playThroughSpeaker: true
}

new IvrTester(config).run(
  { from: "+12342318115", to: "+971600540000"}, // ENBD IVR Production Number
  {
    name: "Emirates NBD Check Card Balance",
    steps: [
      {
        whenPrompt: containsSimilarTo("welcome to emirates"),
        then: doNothing(),
        silenceAfterPrompt: 200,
        timeout: 20000,
      },
      {
        whenPrompt: containsSimilarTo("press 2 for english"),
        then: press("2"),
        silenceAfterPrompt: 200,
        timeout: 20000,
      },
      {
        whenPrompt: containsSimilarTo("to continue with automated phone banking press 2"),
        then: press("2"),
        silenceAfterPrompt: 1000,
        timeout: 20000,
      },
      {
        whenPrompt: containsSimilarTo("please confirm in a few words what's the reason for your call"),
        then : say("check my account balance"),
        silenceAfterPrompt: 1000,
        timeout: 60000,
      },
      {
        whenPrompt: containsSimilarTo("you want to check your account balance is that right"),
        then : say("correct"),
        silenceAfterPrompt: 1000,
        timeout: 60000,
      },
      {
        whenPrompt: containsSimilarTo("please enter any of your valid card number"),
        then : press(process.env.CREDIT_CARD_NUMBER),
        silenceAfterPrompt: 1000,
        timeout: 60000,
      },
      {
        whenPrompt: containsSimilarTo("enter your 4 digit card pin"),
        then : press(process.env.CREDIT_CARD_PIN),
        silenceAfterPrompt: 500,
        timeout: 60000,
      },
      {
        whenPrompt: containsSimilarTo("through emirates NBD whatsapp banking would you like to try it now for yes press one else press 2"),
        then : press("2"),
        silenceAfterPrompt: 500,
        timeout: 60000,
        
      },
      {
        whenPrompt: containsSimilarTo("the balance in your current account ending with"),
        then : hangUp(),
        silenceAfterPrompt: 2500,
        timeout: 60000,
      },
  
     ],
  }
);
