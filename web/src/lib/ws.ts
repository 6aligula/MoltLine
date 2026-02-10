const WS_URL = (import.meta.env.VITE_WS_URL as string | undefined)
  || (import.meta.env.PROD ? 'wss://api.moldline.space' : undefined);

export function wsUrl(params: { token: string }) {
  if (!WS_URL) throw new Error('Missing VITE_WS_URL (see .env.example)');
  const base = WS_URL.replace(/\/$/, '');
  return `${base}/ws?token=${encodeURIComponent(params.token)}`;
}

export type WsMessage =
  | { type: 'hello'; data: { userId: string } }
  | { type: 'message'; data: any; convoId?: string };

export function connectWs(params: {
  token: string;
  onMessage: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
}) {
  const ws = new WebSocket(wsUrl({ token: params.token }));
  ws.onopen = () => params.onOpen?.();
  ws.onclose = () => params.onClose?.();
  ws.onmessage = (ev) => {
    try {
      const json = JSON.parse(String(ev.data));
      params.onMessage(json);
    } catch {
      // ignore
    }
  };
  return ws;
}
