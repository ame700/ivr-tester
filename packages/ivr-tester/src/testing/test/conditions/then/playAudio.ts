import { Call } from "../../../../call/Call";
import { Then } from "./Then";
import * as fs from 'fs';

export const playAudio = (audioFilePath: string): Then => {  
    return {
      do: (call: Call) => call.sendMedia(fs.readFileSync(audioFilePath)),
      describe: () => {
        return `play recording: ` + audioFilePath;
      },
    };
  };
  