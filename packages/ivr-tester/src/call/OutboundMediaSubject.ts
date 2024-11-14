import { OutboundMediaObserver } from "./OutboundMediaObserver";

export interface OutboundMediaSubject {

    registerObserver(observer: OutboundMediaObserver): void;

    notifyAllObservers(media: Buffer , name:string): void;

    ignoreMedia(name : string) : boolean;
}