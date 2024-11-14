import { Emitter } from "../../../Emitter";

export interface SynthesizeEvent {
  /**
   * Indicates whether the transcription isn't going to change
   */
  isFinal: boolean;
  synthesizeText: string;
}

export type SynthesizeEvents = {
    synthesize: SynthesizeEvent;
};

export interface SynthesizerPlugin extends Emitter<SynthesizeEvents> {
  close(): void;
  synthesize(text: string): Promise<Buffer>;
}
