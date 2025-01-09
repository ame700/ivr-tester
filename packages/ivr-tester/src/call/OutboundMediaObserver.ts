
export interface OutboundMediaObserver {

    observedMedia(media : Buffer | ArrayBuffer , name: string) : void;

}