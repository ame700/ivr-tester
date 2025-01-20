import { IDeferred } from "./interfaces";
export declare const calculateLogBufferSize: (arr: any[]) => number;
export declare const calculateLogMessageSize: (trace: any) => number;
export declare const getDeferred: () => IDeferred;
export declare const deepClone: <T>(itemToBeCloned: T, depth?: number) => T | null;
