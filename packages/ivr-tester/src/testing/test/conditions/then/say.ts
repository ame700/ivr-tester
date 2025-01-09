import { Call } from "../../../../call/Call";
import { SynthesizerPlugin } from "../../../../call/transcription/plugin/SynthesizerPlugin";
import { Then } from "./Then";

export const say = (text : string): Then => {
  return {
    do: (call: Call, synthesizerPlugin: SynthesizerPlugin) => {
      synthesizerPlugin.synthesize(text).then((voice)=>{
        call.sendMedia(voice);
      })
    },
    describe: () => {
      return `Say: ` + text;
    },
  };
};
