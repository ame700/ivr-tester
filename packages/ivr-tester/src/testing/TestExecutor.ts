import { Call } from "../call/Call";
import { TestSession } from "../testRunner";
import { CallTranscriber } from "../call/transcription/CallTranscriber";
import { TranscriberFactory } from "../call/transcription/plugin/TranscriberFactory";
import { Scenario } from "../configuration/scenario/Scenario";
import { inOrder } from "./test/inOrder";
import { SynthesizerFactory } from "../call/transcription/plugin/SynthesizerFactory";

export interface TestExecutor {
  startTest(scenario: Scenario, call: Call): TestSession;
}

export function testExecutor(
  transcriberFactory: TranscriberFactory,
  synthesizerFactory: SynthesizerFactory
): TestExecutor {
  return {
    startTest(scenario: Scenario, call: Call): TestSession {
      const callTranscriber = new CallTranscriber(
        call,
        transcriberFactory.create()
      );

      const callFlowSession = inOrder(scenario.steps).runAgainstCallFlow(
        callTranscriber,
        call,
        synthesizerFactory?.create()
      );

      return {
        call,
        scenario,
        callFlowSession,
      };
    },
  };
}
