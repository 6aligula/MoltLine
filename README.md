# MoldLine Chat Stack

![Status](https://img.shields.io/badge/status-experimental-yellow)
![License](https://img.shields.io/badge/license-ISC-blue)

**MoldLine** es una aplicación de mensajería en tiempo real construida como experimento para explorar el desarrollo asistido por IA. El objetivo es crear una aplicación de chat funcional (inspirada en WhatsApp) utilizando agentes de IA en el proceso de desarrollo.

## 🎯 Características

### ✅ Implementado (MVP)
- **Mensajería 1:1 (DM)**: Conversaciones directas entre usuarios
- **Salas de chat**: Crear y unirse a salas grupales
- **Comunicación en tiempo real**: WebSocket para mensajes instantáneos
- **API REST**: Endpoints HTTP para operaciones CRUD
- **Persistencia en memoria**: Sistema de almacenamiento simple para el MVP
- **Autenticación básica**: Sistema de autenticación por header para desarrollo

### 🏗️ Arquitectura

El proyecto está organizado en una estructura multi-stack con Docker Compose:

```
chat-stack/
├── moldline/              # Frontend + Backend v1 (Node.js + Express)
│   ├── server.js         # Servidor WebSocket + REST API
│   ├── web/              # Interfaz web
│   └── scripts/          # Utilidades y tests
│
├── moldline-api-v2/      # Backend v2 (TypeScript + Arquitectura Hexagonal)
│   └── src/
│       ├── domain/       # Entidades y tipos del dominio
│       ├── application/  # Casos de uso
│       ├── adapters/     # HTTP, WS, Persistencia
│       ├── ports/        # Interfaces
│       └── bootstrap/    # Configuración
│
└── docker-compose.yml    # Orquestación de servicios
```

## 🚀 Inicio Rápido

### Prerequisitos
- Docker & Docker Compose
- Node.js 18+ (para desarrollo local)

### Levantar con Docker

```bash
# Clonar el repositorio
git clone <repo-url>
cd chat-stack

# Iniciar los servicios
docker-compose up -d

# Verificar que los servicios estén corriendo
docker-compose ps
```

Los servicios estarán disponibles en:
- **Web UI**: http://localhost:8787
- **API v2**: http://localhost:18000

### Desarrollo Local

#### Backend v1 (moldline)
```bash
cd moldline
npm install
npm run dev  # Servidor en puerto 8787
```

#### Backend v2 (moldline-api-v2)
```bash
cd moldline-api-v2
npm install
npm run dev  # API en puerto 18000
```

## 📡 API Reference

### Endpoints REST

#### Autenticación y Usuarios
```http
GET /health
# Verifica estado del servidor

GET /me
# Headers: x-user-id
# Retorna información del usuario actual

GET /users
# Lista todos los usuarios
```

#### Conversaciones Directas (DM)
```http
POST /dm
# Headers: x-user-id
# Body: { "otherUserId": "string" }
# Crea o recupera una conversación 1:1
```

#### Salas de Chat
```http
POST /rooms
# Headers: x-user-id
# Body: { "name": "string" }
# Crea una nueva sala

POST /rooms/:roomId/join
# Headers: x-user-id
# Unirse a una sala existente

GET /rooms
# Headers: x-user-id
# Lista salas disponibles
```

#### Mensajes
```http
POST /messages
# Headers: x-user-id
# Body: { "convoId": "string", "text": "string" }
# Envía un mensaje a una conversación

GET /conversations
# Headers: x-user-id
# Lista todas las conversaciones del usuario

GET /conversations/:convoId
# Headers: x-user-id
# Obtiene detalles de una conversación
```

### WebSocket

#### Conexión
```javascript
const ws = new WebSocket('ws://localhost:8787?userId=<userId>');

ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  
  if (type === 'hello') {
    console.log('Conectado:', data.userId);
  }
  
  if (type === 'message') {
    console.log('Nuevo mensaje:', data);
  }
};
```

#### Eventos
- **hello**: Confirmación de conexión
- **message**: Nuevo mensaje en tiempo real

## 🏛️ Arquitectura Técnica

### Stack Tecnológico
- **Backend v1**: Node.js + Express + WebSocket (ws)
- **Backend v2**: TypeScript + Arquitectura Hexagonal + Express
- **Frontend**: HTML/CSS/JavaScript vanilla (Web UI simple)
- **Base de datos**: In-memory (Map/Set) - MVP
- **Contenedores**: Docker + Docker Compose
- **Validación**: Zod

### Patrones de Diseño

#### API v2 - Arquitectura Hexagonal
```
┌─────────────────────────────────────────┐
│         Adapters (HTTP/WS)              │
│  ┌──────────────────────────────────┐   │
│  │      Application Layer            │   │
│  │  ┌────────────────────────────┐   │   │
│  │  │     Domain Layer           │   │   │
│  │  │  - Entities                │   │   │
│  │  │  - Types                   │   │   │
│  │  │  - Business Logic          │   │   │
│  │  └────────────────────────────┘   │   │
│  │  - UseCases                       │   │
│  └──────────────────────────────────┘   │
│  - HTTP Server                          │
│  - WebSocket Gateway                    │
│  - Persistence (In-Memory)              │
└─────────────────────────────────────────┘
```

### Entidades del Dominio

#### User
```typescript
{
  userId: string;
  name: string;
}
```

#### Conversation
```typescript
{
  convoId: string;
  kind: 'dm' | 'room';
  members: string[];
  messages: Message[];
  // Para DM
  key?: string;
  // Para rooms
  name?: string;
  createdBy?: string;
  createdAt?: number;
}
```

#### Message
```typescript
{
  messageId: string;
  convoId: string;
  from: string;
  text: string;
  ts: number;
}
```

## 🔧 Configuración

### Variables de Entorno

#### moldline (Backend v1)
```env
PORT=8787
```

#### moldline-api-v2 (Backend v2)
```env
PORT=18000
```

### Docker Compose

El proyecto utiliza una red externa `web-proxy` para integración con otros servicios:

```yaml
networks:
  web-proxy:
    external: true
```

## 🧪 Testing

### Smoke Test WebSocket
```bash
cd moldline
node scripts/ws_smoke_test.js
```

## 📝 Estado del Proyecto

### Implementado ✅
- Mensajería 1:1 (DM)
- Salas de chat grupales
- WebSocket para tiempo real
- API REST completa
- Arquitectura limpia (v2)
- Dockerización

### No Implementado (Futuro) 🚧
- Cifrado end-to-end
- Base de datos persistente (SQLite/Postgres)
- Moderación y anti-spam
- Autenticación robusta (JWT/OAuth)
- Notificaciones push
- Historial de mensajes paginado
- Envío de archivos/multimedia
- Indicadores de escritura (typing...)
- Mensajes leídos/entregados
- Búsqueda de mensajes

## 🎯 Roadmap

1. **Fase 1 (Actual)**: MVP con funcionalidad básica
2. **Fase 2**: Persistencia con base de datos real
3. **Fase 3**: Autenticación y seguridad
4. **Fase 4**: Features avanzados (typing, read receipts)
5. **Fase 5**: Escalabilidad y optimización

## 🤝 Contribuir

Este es un experimento de desarrollo asistido por IA. Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

**Principios**:
- Mantén los cambios pequeños y enfocados
- Escribe código limpio y bien documentado
- Agrega tests cuando sea posible

## 📜 Licencia

ISC License - ver archivo LICENSE para más detalles

## 👥 Usuarios de Desarrollo

El sistema incluye dos usuarios pre-cargados para testing:
- **User A** (userId: `a`)
- **User B** (userId: `b`)

## 🔗 Links Útiles

- [Documentación de Arquitectura](./moldline/ARCHITECTURE.md)
- [Log de Desarrollo](./moldline/DEVLOG.md)
- [Roadmap Detallado](./moldline/ROADMAP.md)
- [TODO List](./moldline/TODO.md)

---

**¿Por qué este proyecto?**

MoldLine es un experimento para explorar cómo los agentes de IA pueden participar en el desarrollo de software end-to-end, desde la arquitectura hasta la implementación, manteniendo buenas prácticas y patrones de diseño.
