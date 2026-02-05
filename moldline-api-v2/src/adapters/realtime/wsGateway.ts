import type { RealtimeGateway, WebSocketLike } from '../../ports/realtime';
import type { ConversationId, UserId } from '../../domain/types';
import type { Message } from '../../domain/entities';

export class InProcessWsGateway implements RealtimeGateway {
  private socketsByUser = new Map<UserId, Set<WebSocketLike>>();

  registerUserSocket(userId: UserId, ws: WebSocketLike) {
    if (!this.socketsByUser.has(userId)) this.socketsByUser.set(userId, new Set());
    this.socketsByUser.get(userId)!.add(ws);
    ws.on('close', () => {
      this.socketsByUser.get(userId)?.delete(ws);
    });
  }

  broadcastMessage(convoId: ConversationId, msg: Message, members: UserId[]) {
    const payload = JSON.stringify({ type: 'message', data: msg, convoId });
    for (const member of members) {
      const set = this.socketsByUser.get(member);
      if (!set) continue;
      for (const ws of set) {
        // 1 == OPEN in ws
        if (ws.readyState === 1) ws.send(payload);
      }
    }
  }
}
