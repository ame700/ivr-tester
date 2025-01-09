import { DtmfBufferGenerator } from "../call/dtmf/DtmfBufferGenerator";
import { TranscriberFactory } from "../call/transcription/plugin/TranscriberFactory";
import { FilenameFactory } from "../call/recording/filename/FilenameFactory";
import { SynthesizerFactory } from "../call/transcription/plugin/SynthesizerFactory";
import { GeneSysAuth } from "../call/Genesys";

export interface GenesysConfig {
  /**
   * DTMF tone generator
   */
  dtmfGenerator?: DtmfBufferGenerator;

  /**
   * Factory to create a instance of a transcriber per test
   */
  transcriber: TranscriberFactory;
  
  synthesizer?: SynthesizerFactory;

  recording?: {
    /**
     * Configuration for recording the call's audio
     */
    audio?: {
      outputPath: string;
      filename?: string | FilenameFactory;
    };
    /**
     * Configuration for recording the call's transcription
     */
    transcript?: {
      outputPath: string;
      filename?: string | FilenameFactory;
      /**
       * Includes what you responded with to the prompt
       */
      includeResponse?: boolean;
    };
  };

  playThroughSpeaker? : boolean;

  /** 
   * GeneSys Auth details for env and token 
   * env example is mec1.pure.cloud
   *
  */
  
  genesysAuth : GeneSysAuth;
  /**
   * How long to wait for any of the calls to be established (in milliseconds) before timing out.
   */
  msTimeoutWaitingForCall?: number | undefined;
}
