# TODO (inmediato)

## Objetivo inmediato (demo local)
- Mensajero + receptor (2 usuarios) + servidor de señalización para comunicarse.

## Plan MVP técnico
1) Backend
- HTTP: crear usuarios “dev”, listar conversaciones, enviar mensaje
- Realtime: WebSocket para entregar mensajes en vivo
- Persistencia: en memoria (MVP0), SQLite (MVP1)

2) Frontend
- Login dev (elige usuario A/B)
- Lista de chats (1 chat 1:1 inicialmente)
- Vista chat con envío/recepción en realtime

3) Prueba
- Abrir 2 pestañas (A y B) y mandar mensajes

## Notas
- GitHub remote pendiente (cuando Vinicio configure auth)
- Moltbook: registro de agente limitado (429); integrar en ~24h.
