# MoldLine — Instrucciones para la app iOS

Documento para el desarrollador que implementa la app nativa iOS. Contiene la información necesaria para conectar con la API en Cloud Run.

## Visión del proyecto

**MoldLine** aspira a ser un clon de WhatsApp. Estamos en fase inicial: la API está funcionando y el frontend web existe solo como prototipo mínimo para probarla. La app iOS es la pieza principal que hay que desarrollar — la experiencia de usuario y el diseño deben inspirarse en WhatsApp, no en la web actual.

## Repositorio y contexto

- **Repositorio**: https://github.com/6aligula/MoltLine — clonar y leer el `README.md` para entender la arquitectura, endpoints y cómo funciona el sistema.

## URLs de la API (Cloud Run)

```
Base URL (REST):    https://moldline-api-example.run.app
WebSocket base:     wss://moldline-api-example.run.app
WebSocket path:     /ws?userId=<userId>
```

## Autenticación

- **Header requerido**: `x-user-id` en todas las peticiones REST que requieren usuario.
- **WebSocket**: El `userId` va en el query string: `/ws?userId=<userId>`.
- **Usuarios de prueba**: `a` y `b` (predefinidos para testing).

## Endpoints REST

Base: `https://moldline-api-312503514287.europe-southwest1.run.app`

| Método | Ruta | Headers | Body | Descripción |
|--------|------|---------|------|-------------|
| GET | `/health` | — | — | Health check |
| GET | `/me` | `x-user-id` | — | Usuario actual |
| GET | `/users` | — | — | Lista de usuarios |
| POST | `/dm` | `x-user-id` | `{ "otherUserId": "string" }` | Crear/obtener DM |
| GET | `/conversations` | `x-user-id` | — | Lista de conversaciones |
| GET | `/conversations/:convoId/messages` | `x-user-id` | — | Mensajes de una conversación |
| POST | `/conversations/:convoId/messages` | `x-user-id` | `{ "text": "string" }` | Enviar mensaje |
| POST | `/rooms` | `x-user-id` | `{ "name": "string" }` | Crear sala |
| POST | `/rooms/:roomId/join` | `x-user-id` | — | Unirse a sala |
| GET | `/rooms` | `x-user-id` | — | Lista de salas |

Todas las respuestas son JSON. Content-Type: `application/json`.

## WebSocket

- **URL completa**: `wss://moldline-api-312503514287.europe-southwest1.run.app/ws?userId=<userId>`
- **Eventos entrantes** (JSON):

| type | data | Descripción |
|------|------|-------------|
| `hello` | `{ "userId": "a" }` | Conexión confirmada |
| `message` | Objeto `Message` | Nuevo mensaje en tiempo real |

- **Objeto Message**:
```json
{
  "messageId": "string",
  "convoId": "string",
  "from": "string",
  "text": "string",
  "ts": 1234567890
}
```

## Modelos de datos

```typescript
User:      { userId: string; name: string }
Conversation: { convoId: string; kind: "dm" | "room"; members: string[] }
Message:   { messageId: string; convoId: string; from: string; text: string; ts: number }
```

## Flujo típico de la app

1. **Login/selector de usuario**: En fase de pruebas usar `a` o `b`.
2. **Listar usuarios**: `GET /users`.
3. **Crear DM**: `POST /dm` con `{ "otherUserId": "..." }`.
4. **Listar conversaciones**: `GET /conversations`.
5. **Cargar mensajes**: `GET /conversations/:convoId/messages`.
6. **Enviar mensaje**: `POST /conversations/:convoId/messages` con `{ "text": "..." }`.
7. **WebSocket**: Conectar a `/ws?userId=<userId>` para recibir mensajes en tiempo real.

## Configuración en la app iOS

Guardar las URLs en configuración o constantes:

```swift
let apiBaseURL = "https://moldline-api-312503514287.europe-southwest1.run.app"
let wsBaseURL = "wss://moldline-api-312503514287.europe-southwest1.run.app"
let wsURL = "\(wsBaseURL)/ws?userId=\(userId)"
```

## Notas

- Los mensajes no son persistentes: si Cloud Run escala a 0 o se reinicia, se pierden (por ahora).
- CORS: las apps nativas no aplican CORS; si usas WebView y hay problemas, avisar para ajustar el backend.
