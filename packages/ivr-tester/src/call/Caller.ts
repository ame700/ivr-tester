import { URL } from "url";
import { IvrNumber } from "../configuration/call/IvrNumber";
import { GenesysNumber } from "../configuration/call/GenesysNumber";

export interface AudioPlaybackCall {
  type: "audio-playback";
  call: Buffer;
}

export interface TelephonyCall {
  type: "telephony";
  call: IvrNumber;
}
export interface GenesysCall {
  type: "genesys-telephony";
  call: GenesysNumber;
}

export type RequestedCall = AudioPlaybackCall | TelephonyCall | GenesysCall;


export interface Caller<T> {
  call(call: T, streamUrl?: URL | string): Promise<RequestedCall>;
}
