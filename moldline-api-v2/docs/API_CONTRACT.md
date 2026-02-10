# API Contract - MoldLine API v2

Base local: `http://localhost:18000`

## Auth

- Preferido: `Authorization: Bearer <jwt>`
- Legacy: `x-user-id`
- Endpoints protegidos sin identidad valida -> `401`

## Endpoints

- `GET /health` -> `{ "ok": true }`
- `GET /me` -> `{ "userId": "...", "name": "..." }`
- `GET /users` -> `User[]`
- `POST /dm` body `{ "otherUserId": "..." }` -> `{ convoId, kind, members }` (siempre `200`)
- `POST /rooms` body `{ "name": "..." }` -> `{ roomId, name }`
- `POST /rooms/:roomId/join` -> `{ roomId, name, members }`
- `GET /rooms` -> `{ roomId, name, memberCount }[]`
- `GET /conversations` -> `{ convoId, kind, members }[]`
- `GET /conversations/:convoId/messages` -> `Message[]`
- `POST /conversations/:convoId/messages` body `{ "text": "..." }` -> `Message`

`Message`:

```json
{ "messageId": "...", "convoId": "...", "from": "...", "text": "...", "ts": 1730000000000 }
```

## Errores

- Envelope comun: `{ "error": "mensaje" }`
- `400`: validacion (ej. `otherUserId` o `text` invalido)
- `401`: auth faltante/invalida
- `404`: conversacion inexistente o usuario fuera de miembros
