import type { Message } from '../domain/entities';
import type { ConversationId, UserId } from '../domain/types';

export interface RealtimeGateway {
  registerUserSocket(userId: UserId, ws: WebSocketLike): void;
  broadcastMessage(convoId: ConversationId, msg: Message, members: UserId[]): void;
}

export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  on(event: 'close', cb: () => void): void;
  close(code?: number, reason?: string): void;
}
