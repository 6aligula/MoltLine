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
WebSocket path:     /ws?token=<jwt>
```

## Autenticación

- **Header requerido**: `Authorization: Bearer <jwt>` en todas las peticiones REST protegidas.
- **WebSocket**: el JWT va en query string: `/ws?token=<jwt>`.
- **Usuarios de prueba**: `a` y `b` (predefinidos para testing).

## Endpoints REST

Base: `https://moldline-api-312503514287.europe-southwest1.run.app`

| Método | Ruta | Headers | Body | Descripción |
|--------|------|---------|------|-------------|
| GET | `/health` | — | — | Health check |
| GET | `/me` | `Authorization: Bearer <jwt>` | — | Usuario actual |
| GET | `/users` | — | — | Lista de usuarios |
| POST | `/dm` | `Authorization: Bearer <jwt>` | `{ "otherUserId": "string" }` | Crear/obtener DM |
| GET | `/conversations` | `Authorization: Bearer <jwt>` | — | Lista de conversaciones |
| GET | `/conversations/:convoId/messages` | `Authorization: Bearer <jwt>` | — | Mensajes de una conversación |
| POST | `/conversations/:convoId/messages` | `Authorization: Bearer <jwt>` | `{ "text": "string" }` | Enviar mensaje |
| POST | `/rooms` | `Authorization: Bearer <jwt>` | `{ "name": "string" }` | Crear sala |
| POST | `/rooms/:roomId/join` | `Authorization: Bearer <jwt>` | — | Unirse a sala |
| GET | `/rooms` | `Authorization: Bearer <jwt>` | — | Lista de salas |

Todas las respuestas son JSON. Content-Type: `application/json`.

## WebSocket

- **URL completa**: `wss://moldline-api-312503514287.europe-southwest1.run.app/ws?token=<jwt>`
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

1. **Login**: obtener JWT (Auth API) y guardarlo en sesión.
2. **Listar usuarios**: `GET /users`.
3. **Crear DM**: `POST /dm` con `{ "otherUserId": "..." }`.
4. **Listar conversaciones**: `GET /conversations`.
5. **Cargar mensajes**: `GET /conversations/:convoId/messages`.
6. **Enviar mensaje**: `POST /conversations/:convoId/messages` con `{ "text": "..." }`.
7. **WebSocket**: Conectar a `/ws?token=<jwt>` para recibir mensajes en tiempo real.

## Configuración en la app iOS

Guardar las URLs en configuración o constantes:

```swift
let apiBaseURL = "https://moldline-api-312503514287.europe-southwest1.run.app"
let wsBaseURL = "wss://moldline-api-312503514287.europe-southwest1.run.app"
let wsURL = "\(wsBaseURL)/ws?token=\(jwt)"
```

## Notas

- Los mensajes no son persistentes: si Cloud Run escala a 0 o se reinicia, se pierden (por ahora).
- CORS: las apps nativas no aplican CORS; si usas WebView y hay problemas, avisar para ajustar el backend.
