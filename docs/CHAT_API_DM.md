# Chat API — POST /dm (crear DM)

Contrato del endpoint para alinear backend y cliente (p. ej. iOS).

## Request

- **Método:** `POST /dm`
- **Headers:** `Authorization: Bearer <jwt>`
- **Body:** `{ "otherUserId": "<userId del otro usuario>" }`

## Comportamiento

- **DM nuevo:** se crea la conversación y se devuelve la conversación.
- **DM ya existente:** se devuelve la misma conversación (mismo par de usuarios). **No** se devuelve 4xx ni 409.
- **convoId determinista:** para el mismo par (A, B) el `convoId` es siempre el mismo, quien llame sea A o B (p. ej. `dm_` + hash del par). Así ambos clientes entran en la misma sala y ven los mismos mensajes.

## Response

- **Código:** siempre **200** (nuevo o existente).
- **Body:** un **objeto conversación** (misma forma que cada elemento de `GET /conversations`):

```json
{
  "convoId": "<string>",
  "kind": "dm",
  "members": ["<userId1>", "<userId2>"]
}
```

- No hay wrapper (p. ej. no es `{ "data": { ... } }`).
- No se usa 201 ni 204.

El cliente puede decodificar la respuesta como la misma `Conversation` (o el mismo tipo que cada item de `GET /conversations`) y navegar a la pantalla de chat.

## Errores

- **400:** `otherUserId` ausente o inválido.
- **401:** falta `Authorization` o token inválido.
