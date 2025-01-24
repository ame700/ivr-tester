import 'dotenv/config.js';
import * as azureTranscripeModule from "ivr-tester-transcriber-azure-speech-to-text";
import {IvrGenesysTester  , press , hangUp, containsSimilarTo , doNothing, say , CallingServiceType  } from "ivr-tester";


const config = {
  genesysAuth: {
    env: process.env.GENESYS_ENV,
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

  playThroughSpeaker: true
}

new IvrGenesysTester(config).run(
  { to: "+971600540000"}, // ENBD IVR Production Number
  {
    name: "Emirates NBD Check Card Balance",
    steps: [
      {
        whenPrompt: containsSimilarTo("welcome to emirates"),
        then: doNothing(),
        silenceAfterPrompt: 500,
        timeout: 20000,
      },
      {
        whenPrompt: containsSimilarTo("press 2 for english"),
        then: press("2"),
        silenceAfterPrompt: 200,
        timeout: 20000,
      },
      {
        whenPrompt: containsSimilarTo("please confirm in a few words what's the reason for your call"),
        then : say("check my account balance"),
        silenceAfterPrompt: 200,
        timeout: 60000,
      },
      {
        whenPrompt: containsSimilarTo("you want to check your account balance is that right"),
        then : say("yes correct"),
        silenceAfterPrompt: 200,
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
