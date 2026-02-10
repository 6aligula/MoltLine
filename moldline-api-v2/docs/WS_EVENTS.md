# WebSocket Events - MoldLine API v2

## Conexion

- Path: `/ws`
- Auth requerida: `?token=<jwt>`
- Sin identidad valida: close `1008`

## Eventos (server -> client)

`hello`:

```json
{ "type": "hello", "data": { "userId": "a" } }
```

`message`:

```json
{
  "type": "message",
  "data": { "messageId": "m1", "convoId": "dm_xxx", "from": "a", "text": "hola", "ts": 1730000000000 }
}
```

## Notas

- Entrega best-effort (sin ACK/retry WS).
- Historial por REST: `GET /conversations/:convoId/messages`.
- No romper `type`/`data` sin versionado.
