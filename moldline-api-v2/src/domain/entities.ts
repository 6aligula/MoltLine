import type { ConversationId, ConversationKind, MessageId, UserId } from './types';

export interface User {
  userId: UserId;
  name: string;
}

export interface Message {
  messageId: MessageId;
  convoId: ConversationId;
  from: UserId;
  text: string;
  ts: number;
}

export interface Conversation {
  convoId: ConversationId;
  kind: ConversationKind;
  members: UserId[];
  // DM-specific
  key?: string;
  // room-specific
  name?: string;
  createdBy?: UserId;
  createdAt?: number;
  messages: Message[];
}
