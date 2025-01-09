import { Step } from "../../configuration/scenario/Step";
import {
  CallFlowInstructions,
  CallFlowSession,
  CallFlowSessionEvents,
} from "./CallFlowInstructions";
import { setTimeout } from "timers";
import { Call, CallingServiceType } from "../../call/Call";
import { PromptTranscriptionBuilder } from "../../call/transcription/PromptTranscriptionBuilder";
import { Emitter, TypedEmitter } from "../../Emitter";
import {
  TranscriptEvent,
  TranscriptionEvents,
} from "../../call/transcription/plugin/TranscriberPlugin";
import { PostSilencePrompt } from "./PostSilencePrompt";
import { SynthesizerPlugin } from "../../call/transcription/plugin/SynthesizerPlugin";
import { WebSocketEvents } from "../../call/TwilioCall";

export interface Prompt {
  readonly definition: Step;
  setNext(prompt: Prompt): Prompt;
  // TODO Refactor PromptTranscriptionBuilder parameter
  transcriptUpdated(transcriptEvent: PromptTranscriptionBuilder): void;
}

export type MatchedCallback = (
  prompt: Prompt,
  transcriptMatched: string
) => void;

export type TimeoutCallback = (prompt: Prompt, transcript: string) => void;

export type PromptFactory = (
  definition: Step,
  call: Call,
  synthesizerPlugin: SynthesizerPlugin,
  matchedCallback: MatchedCallback,
  timeoutCallback: TimeoutCallback
) => Prompt | undefined;

const defaultPromptFactory: PromptFactory = (
  definition,
  call,
  synthesizerPlugin,
  matchedCallback,
  timeoutCallback
) =>
  new PostSilencePrompt(
    definition,
    call,
    synthesizerPlugin,
    matchedCallback,
    timeoutCallback,
    setTimeout,
    clearTimeout
  );

class RunningOrderedCallFlowInstructions
  extends TypedEmitter<CallFlowSessionEvents>
  implements CallFlowSession {
    private readonly closeRef: () => void;

  constructor(
    private readonly promptDefinitions: ReadonlyArray<Step>,
    private readonly promptFactory: PromptFactory,
    private readonly transcriber: Emitter<TranscriptionEvents>,
    private readonly call: Call,
    private readonly synthesizerPlugin : SynthesizerPlugin
  ) {
    super();
    this.initialise();
    this.closeRef = this.close.bind(this);

    this.exec(this.call , ()=>{
      call
      .getStream()
      .on(WebSocketEvents.Close, this.closeRef);
    },()=>{
      call.on("callClosed", this.closeRef);
    })
    
  }

  // TODO Tidy this
  private initialise(): void {
    const timedOutCallback: TimeoutCallback = (prompt, transcript) => {
      this.emit("timeoutWaitingForMatch", {
        transcription: transcript,
        promptDefinition: prompt.definition,
      });
    };

    const matchedCallback: MatchedCallback = (prompt, transcriptMatched) => {
      this.emit("promptMatched", {
        transcription: transcriptMatched,
        promptDefinition: prompt.definition,
      });
    };
    const lastMatchedCallback: MatchedCallback = (
      prompt,
      transcriptMatched
    ) => {
      matchedCallback(prompt, transcriptMatched);
      this.emit("allPromptsMatched", {});
    };

    const prompts = this.promptDefinitions.map((prompt, index) => {
      const callback =
        this.promptDefinitions.length - 1 === index
          ? lastMatchedCallback
          : matchedCallback;

      return this.promptFactory(prompt, this.call, this.synthesizerPlugin, callback , timedOutCallback);
    });

    const firstPrompt: Prompt = prompts.shift();
    let chain: Prompt = firstPrompt;

    prompts.forEach((item) => {
      chain = chain.setNext(item);
    });

    const promptTranscriptionBuilder = new PromptTranscriptionBuilder();

    const onTranscription = (event: TranscriptEvent) => {
      if (this.promptDefinitions.length === 0) {
        this.emit("allPromptsMatched", {});
        return;
      }

      promptTranscriptionBuilder.add(event);
      this.emit("progress", {
        transcription: promptTranscriptionBuilder.merge(),
      });

      firstPrompt.transcriptUpdated(promptTranscriptionBuilder);
    };

    this.transcriber.on("transcription", onTranscription);
  }

  private close() {
    this.synthesizerPlugin?.close();
  }

  private exec(call: Call, twilioCallback: any, genesysCallBack: any): any {
    if (this.isTwilio(call)) {
      return twilioCallback();
    }
    else {
      return genesysCallBack();
    }
  }

  private isTwilio(call: Call): boolean {
    return call.callingServiceImpl() == CallingServiceType.TWILIO;
  }
}

/**
 * Creates an ordered prompt collection
 */
export function inOrder(
  promptDefinitions: ReadonlyArray<Step>,
  promptFactory: PromptFactory = defaultPromptFactory
): CallFlowInstructions {
  return {
    runAgainstCallFlow: (
      transcriber: Emitter<TranscriptionEvents>,
      call: Call,
      synthesizerPlugin?:SynthesizerPlugin
    ): CallFlowSession =>
      new RunningOrderedCallFlowInstructions(
        promptDefinitions,
        promptFactory,
        transcriber,
        call,
        synthesizerPlugin
      ),
  };

  
}
