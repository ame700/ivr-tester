import { IvrTesterPlugin } from "../../plugins/IvrTesterPlugin";
import chalk from "chalk";
import { CallServerEvents } from "../TwilioCallServer";
import { Emitter } from "../../Emitter";
import { PluginHost } from "../../plugins/PluginManager";
import { TestSession } from "../../testRunner";



const getArgs = (): any=>
  process.argv.reduce((args: any, arg) => {
    // long arg
    if (arg.slice(0, 2) === "--") {
      const longArg = arg.split("=");
      const longArgFlag = longArg[0].slice(2);
      const longArgValue = longArg.length > 1 ? longArg[1] : true;
      args[longArgFlag] = longArgValue;
    }
    return args;
  }, {});
  
let recipientName = (getArgs().recName) || "IVR" ;
let delay = (getArgs().logDelay) || 0 ;


const ivrTranscription = (
  callServer: Emitter<CallServerEvents>,
  testSession: TestSession
): void => {
  let includeTestName = false;

  let totalTests = 0;
  callServer.on("testStarted", () => {
    totalTests++;
    if (totalTests >= 2) {
      includeTestName = true;
    }
  });

  testSession.callFlowSession.on("progress", (event) => {
    const state = chalk.gray.bold("Transcribing: ");

    const testName = includeTestName ? `${testSession.scenario.name}: ` : "";
    const transcripedText = event.transcription.trim();
    logWithDelay(()=>{
      process.stdout.cursorTo(0);
      process.stdout.clearLine(0);
      process.stdout.write(state + chalk.gray(`${testName}${transcripedText}`));    
    });
  });
};


const ivrTestPassed = (testSession: TestSession): void =>
  testSession.callFlowSession.on("allPromptsMatched", () =>{
    
    logWithDelay(()=>{
      console.log(chalk.green(`Test Complete: ${testSession.scenario.name}...`))
    });
  });

const ivrTestFailed = (testSession: TestSession): void =>
  testSession.callFlowSession.on("timeoutWaitingForMatch", (event) => {
    logWithDelay(()=>{
      console.log("");
      console.log(
        `${chalk.bold.blue("Test -")} ${chalk.bold.blue(
          testSession.scenario.name
        )}\n`,
        `${recipientName}: "${event.transcription}"\n`,
        chalk.red("Timed out waiting for prompt to complete\n")
      );
      console.log(chalk.bold.red(`Test Failed`));    
    });
  });

const callConnected = (callServer: Emitter<CallServerEvents>): void => {
  callServer.on("callConnected", () => {
    console.log("Call connected");
  });
};

const callServerListening = (callServer: Emitter<CallServerEvents>): void => {
  callServer.on("listening", ({ localUrl }) => {
    console.log(
      `Server is listening on ${localUrl.port} for the stream for the call`
    );
  });
};

const callServerStopped = (callServer: Emitter<CallServerEvents>): void => {
  callServer.on("stopped", () =>  logWithDelay(()=>{
    console.log("The server has closed")
  }));
};

const callServerErrored = (callServer: Emitter<CallServerEvents>): void => {
  callServer.on("error", (event) =>
      
    logWithDelay(()=>{
      console.error("Server experienced an error", event.error.message)
    })
  );
};

const callRequested = (emitter: PluginHost): void =>
  emitter.on("callRequested", (event) => {
    switch (event.requestedCall.type) {
      case "audio-playback":
        console.log("Playing back audio to simulate call");
        break;
      case "telephony":
        console.log(`Calling ${event.requestedCall.call.to}...`);
        break;
      case "genesys-telephony":
          console.log(`Calling ${event.requestedCall.call.to}...`);
          break;
    }
  });

const callRequestErrored = (emitter: PluginHost): void =>
  emitter.on("callRequestErrored", (event) =>
    logWithDelay(()=>{
      console.error(`Call failed`, event.error.message)
    })
  );

const ivrTestConditionMet = (
  callServer: Emitter<CallServerEvents>,
  testSession: TestSession
): void => {
  let includeTestName = false;

  let totalTests = 0;
  callServer.on("testStarted", () => {
    totalTests++;
    if (totalTests >= 2) {
      includeTestName = true;
    }
  });

  testSession.callFlowSession.on("promptMatched", (event) => {
    const lines: string[] = [];

    if (includeTestName) {
      lines.push(`Test - ${testSession.scenario.name}`);
    }
    lines.push(`${recipientName}: "${event.transcription}"`);
    lines.push(`Bot: ${event.promptDefinition.then.describe()}`);
    logWithDelay(()=>{
      console.log("");
      console.log(chalk.bold.blue(lines.join(`\n`)));
    });
  });
};

const callServerStarted = (eventEmitter: PluginHost) => {
  eventEmitter.on("callServerStarted", ({ callServer }) => {
    callConnected(callServer);
    callServerListening(callServer);
    callServerStopped(callServer);
    callServerErrored(callServer);

    callServer.on("testStarted", ({ testSession }) => {
      console.log(`Call using test '${testSession.scenario.name}'`);
      ivrTestPassed(testSession);
      ivrTestFailed(testSession);
      ivrTestConditionMet(callServer, testSession);
      ivrTranscription(callServer, testSession);
    });
  });
};

const testAborting = (eventEmitter: PluginHost) => {
  eventEmitter.on("testsAborting", ({ reason }) => {
    logWithDelay(()=>{
      console.log(chalk.bold.red(`Timed out: ${reason}`));
    })
  });
};

const logWithDelay = (fun:any) =>{
  setTimeout(()=>{
    fun();
  }, delay);
}

export const consoleUserInterface = (): IvrTesterPlugin => ({
  initialise(eventEmitter: PluginHost): void {
    callServerStarted(eventEmitter);
    callRequested(eventEmitter);
    callRequestErrored(eventEmitter);
    testAborting(eventEmitter);
  },
});
