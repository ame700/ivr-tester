import 'dotenv/config.js';
import * as azureTranscripeModule from "ivr-tester-transcriber-azure-speech-to-text";
import { IvrTester, similarTo, press, hangUp } from "ivr-tester";

const totalCalls = 2;
var successAttempts = 0;
var failedAttempts = 0;

const config = {
  localServerPort: process.env.LOCAL_SERVER_PORT,
  publicServerUrl: process.env.PUBLIC_SERVER_URL,
  twilioAuth: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
  transcriber: azureTranscripeModule.azureSpeechToText({
    useEnhanced: true,
  }),
}

function ivrCheck(numberOfCalls) {

  if (numberOfCalls == 0) {
    summry();
    return;
  }

  console.log("CALL #" + (totalCalls - numberOfCalls + 1) + " started")
  new IvrTester(config).run(
    { from: "+12342318115", to: "+971600540000" }, //+971600540000
    {
      name: "ENDB IVR Check Test",
      steps: [
        {
          whenPrompt: similarTo("welcome to emirates nbd"),
          then: hangUp(),
          silenceAfterPrompt: 200,
          timeout: 5000,
        }
      ],
    }
  ).then(() => {
    successAttempts++;
    sleep(2000);
    ivrCheck(numberOfCalls - 1)
  }, () => {
    failedAttempts++;
    sleep(2000);
    ivrCheck(numberOfCalls - 1)
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function summry() {
  console.log("");
  console.log("------------------------------------------------")
  console.log("Sequence of [" + totalCalls + "] Calls has completed")
  console.log(successAttempts + " calls success")
  console.log(failedAttempts + " calls fail");
  console.log("------------------------------------------------")
}

ivrCheck(totalCalls)