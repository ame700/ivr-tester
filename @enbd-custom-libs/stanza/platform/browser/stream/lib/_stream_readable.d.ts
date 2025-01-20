export = Readable;
declare function Readable(options: any): Readable;
declare class Readable {
    constructor(options: any);
    _readableState: ReadableState | undefined;
    readable: boolean | undefined;
    _read: any;
    _destroy: any;
    set destroyed(arg: boolean);
    get destroyed(): boolean;
    destroy: (err: any, cb: any) => any;
    _undestroy: () => void;
    push(chunk: any, encoding: any): any;
    unshift(chunk: any): any;
    isPaused(): boolean;
    setEncoding(enc: any): Readable;
    read(n: any): any;
    pipe(dest: any, pipeOpts: any): any;
    unpipe(dest: any): Readable;
    on(ev: any, fn: any): EE;
    addListener: any;
    resume(): Readable;
    pause(): Readable;
    wrap(stream: any): Readable;
    get readableHighWaterMark(): number;
}
declare namespace Readable {
    export { ReadableState };
    export { fromList as _fromList };
}
declare function ReadableState(options: any, stream: any): void;
declare class ReadableState {
    constructor(options: any, stream: any);
    objectMode: boolean;
    highWaterMark: number;
    buffer: BufferList<globalThis.Buffer>;
    length: number;
    pipes: any;
    pipesCount: number;
    flowing: any;
    ended: boolean;
    endEmitted: boolean;
    reading: boolean;
    sync: boolean;
    needReadable: boolean;
    emittedReadable: boolean;
    readableListening: boolean;
    resumeScheduled: boolean;
    destroyed: boolean;
    defaultEncoding: any;
    awaitDrain: number;
    readingMore: boolean;
    decoder: any;
    encoding: any;
}
import EE_1 = require("events");
import EE = EE_1.EventEmitter;
declare function fromList(n: any, state: any): any;
import BufferList_1 = require("./internal/streams/BufferList");
import BufferList = BufferList_1.BufferList;
