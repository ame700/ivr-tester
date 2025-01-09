import { SynthesizerPlugin } from "./SynthesizerPlugin";
import { CanRunCheck } from "./TranscriberFactory";



/**
 * Factory to create a instance of a Synthesize per test
 */
export interface SynthesizerFactory {
  /**
   * Called on startup to check that the transcriber has
   * everything it needs to work properly when a call is connected
   * e.g. credentials
   */
  checkCanRun: () => Promise<CanRunCheck> | CanRunCheck; // TODO Rename as 'preflightChecks'?

  /**
   * Creates the transcriber. This will be called once per call.
   */
  create: () => SynthesizerPlugin;
}
