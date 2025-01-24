import { MediaStream} from '@roamhq/wrtc';
import { IMediaSession, SessionTypes } from 'genesys-cloud-streaming-client';


export interface GeneSysAuth {
  env: string;
  authToken: string;
}

export interface IStartSoftphoneSessionParams extends IStartSessionParams {
  /** phone number to dial */
  phoneNumber?: string;
  /** caller id phone number for outbound call */
  callerId?: string;
  /** caller id name for outbound call */
  callerIdName?: string;
  /** the queue ID to call on behalf of */
  callFromQueueId?: string;
  /** queue ID to call */
  callQueueId?: string;
  /** user ID to call */
  callUserId?: string;
  /** priority to assign to call if calling a queue */
  priority?: number;
  /** language skill ID to use for routing call if calling a queue */
  languageId?: string;
  /** skill IDs to use for routing if calling a queue */
  routingSkillsIds?: string[];
  /** list of existing conversations to merge into new ad-hoc conference */
  conversationIds?: string[];
  /** Used for starting conference calls with multiple participants. */
  participants?: ISdkSoftphoneDestination[];
  /** user to user information managed by SIP session app */
  uuiData?: string;
}
export interface ISdkSoftphoneDestination {
  /** address or phone number */
  address: string;
  name?: string;
  userId?: string;
  queueId?: string;
}
export interface IStartSessionParams extends ISdkMediaDeviceIds {
  sessionType: SessionTypes;
}

export interface ISdkMediaDeviceIds {

  videoDeviceId?: string | boolean | null;

  audioDeviceId?: string | boolean | null;
}

export interface IExtendedMediaSession extends IMediaSession {
  originalRoomJid: string;
  active: boolean;
  sessionReplacedByReinvite?: boolean;
  videoMuted?: boolean;
  audioMuted?: boolean;
  pcParticipant?: IConversationParticipant;
  _alreadyAccepted?: boolean;
  _emittedSessionStarteds?: { [conversationId: string]: true };
  _screenShareStream?: MediaStream;
  _outboundStream?: MediaStream;
}

export interface IConversationParticipant {
  id: string;
  address: string;
  purpose: string;
  state: string;
  direction: string;
  userId?: string;
  muted: boolean;
  videoMuted?: boolean;
  confined: boolean;
}

export interface IOrgDetails {
  id: string;
  name: string;
}

export interface IPersonDetails {
  id: string;
  name: string;
  chat: {
    jabberId: string;
  };
  station?: {
    /* use this one */
    effectiveStation?: IStation;
    associatedStation?: IStation;
    lastAssociatedStation?: IStation;
    defaultStation?: IStation;
  }
}
export interface IStation {
  id: string;
  name: string;
  status: 'ASSOCIATED' | 'AVAILABLE';
  userId: string;
  webRtcUserId: string;
  type: 'inin_webrtc_softphone' | 'inin_remote';
  webRtcPersistentEnabled: boolean;
  webRtcForceTurn: boolean;
  webRtcCallAppearances: number;
}

export interface SubscriptionEvent {
  metadata: {
    correlationId: string;
  };
  topicName: string;
  eventBody: any;
}

