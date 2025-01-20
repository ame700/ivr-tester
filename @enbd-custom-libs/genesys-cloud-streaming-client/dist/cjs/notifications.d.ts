import { PubsubEvent, PubsubSubscription, PubsubSubscriptionWithOptions } from 'stanza/protocol';
import { Client } from './client';
import { StreamingClientExtension } from './types/interfaces';
import { NamedAgent } from './types/named-agent';
export declare class Notifications implements StreamingClientExtension {
    client: Client;
    stanzaInstance?: NamedAgent;
    subscriptions: any;
    bulkSubscriptions: any;
    topicPriorities: any;
    debouncedResubscribe: any;
    constructor(client: any);
    get pubsubHost(): string;
    handleStanzaInstanceChange(stanza: NamedAgent): void;
    topicHandlers(topic: string): Array<(obj?: any) => void>;
    pubsubEvent({ pubsub }: {
        pubsub: PubsubEvent;
    }): void;
    xmppSubscribe(topic: string): Promise<PubsubSubscriptionWithOptions | void>;
    xmppUnsubscribe(topic: string): Promise<PubsubSubscription | void>;
    mapCombineTopics(topics: string[]): Array<{
        id: string;
    }>;
    prioritizeTopicList(topics: Array<{
        id: string;
    }>): Array<{
        id: string;
    }>;
    getTopicPriority(topic: string, returnDefault?: boolean): number;
    truncateTopicList(topics: Array<{
        id: string;
    }>): Array<{
        id: string;
    }>;
    makeBulkSubscribeRequest(topics: string[], options: any): Promise<any>;
    createSubscription(topic: string, handler: (obj?: any) => void): void;
    removeSubscription(topic: string, handler: (obj?: any) => void): void;
    removeTopicPriority(topic: string): void;
    getActiveIndividualTopics(): string[];
    resubscribe(): Promise<any>;
    subscriptionsKeepAlive(): void;
    getTopicParts(topic: string): {
        prefix: string;
        postfixes: string[];
    };
    setTopicPriorities(priorities?: {}): void;
    subscribe(topic: string, handler?: (..._: any[]) => void, immediate?: boolean, priority?: number): Promise<any>;
    unsubscribe(topic: string, handler?: (..._: any[]) => void, immediate?: boolean): Promise<any>;
    bulkSubscribe(topics: string[], options?: BulkSubscribeOpts, priorities?: {
        [topicName: string]: number;
    }): Promise<any>;
    get expose(): NotificationsAPI;
}
export interface NotificationsAPI {
    subscribe(topic: string, handler?: (..._: any[]) => void, immediate?: boolean, priority?: number): Promise<any>;
    unsubscribe(topic: string, handler?: (..._: any[]) => void, immediate?: boolean): Promise<any>;
    bulkSubscribe(topics: string[], options?: BulkSubscribeOpts, priorities?: {
        [topicName: string]: number;
    }): Promise<any>;
}
export interface BulkSubscribeOpts {
    replace?: boolean;
    force?: boolean;
}
