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

El proyecto está organizado en dos servicios principales:

```
MoltLine/
├── web/                  # Frontend (Vite + React)
│   ├── src/
│   │   ├── App.tsx       # Interfaz del chat
│   │   └── lib/          # api.ts, ws.ts — cliente API y WebSocket
│   └── .env              # VITE_API_BASE_URL, VITE_WS_URL (crear en local)
│
├── moldline-api-v2/      # Backend (TypeScript + Arquitectura Hexagonal)
│   ├── deploy-cloudrun.sh  # Deploy a Google Cloud Run
│   └── src/
│       ├── domain/       # Entidades y tipos del dominio
│       ├── application/  # Casos de uso
│       ├── adapters/     # HTTP, WS, Persistencia
│       ├── ports/        # Interfaces
│       └── bootstrap/    # Configuración
│
├── docker-compose.yml      # API + Web (local)
├── docker-compose.prod.yml # Override para producción (red web-proxy)
├── nginx/
│   └── moldline.conf.example  # Config Nginx reverse proxy + SSL
├── web/
│   ├── Dockerfile        # Build Vite + nginx
│   └── nginx.conf        # Nginx interno del contenedor web
├── deploy.sh             # Scripts de deploy
└── .nvmrc                # Node 22 (nvm use)
```

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 22+ (recomendado: `nvm install` y `nvm use` si usas nvm — hay `.nvmrc`)
- Docker & Docker Compose (opcional, para producción)

### Desarrollo Local

Si usas nvm: `nvm use` (lee la versión del `.nvmrc`).

Necesitas levantar **dos terminales**:

**Terminal 1 — API:**
```bash
cd moldline-api-v2
npm install
npm run dev
# API en http://localhost:18000
```

**Terminal 2 — Web:**
```bash
cd web
npm install
cp .env.example .env   # o crea .env con las URLs de la API
npm run dev
# Web en http://localhost:5173
```

Abre http://localhost:5173 en el navegador. Usuarios de prueba: `a` y `b`.

**Probar frontend local contra API en Cloud Run:**
```bash
cd web
cp .env.cloud.example .env.cloud
# Edita .env.cloud y pon la URL de tu API (la que muestra deploy-cloudrun.sh)
npm run dev:cloud
# Web en http://localhost:5173, conectada a la API en Cloud Run
```

### Levantar con Docker

```bash
docker compose up -d --build
```

Los servicios estarán disponibles en:
- **Web**: http://localhost:5173
- **API**: http://localhost:18000

Para producción (detrás de Nginx): `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

### Backend en Google Cloud Run

Para desplegar solo la API (sin servidor propio):

```bash
cd moldline-api-v2
./deploy-cloudrun.sh
```

Tras el deploy, el script muestra la URL de la API (ej. `https://moldline-api-xxx.run.app`).

### Conectar el frontend a la API

El frontend usa dos variables en `web/.env`:

| Variable | Descripción |
|----------|-------------|
| `VITE_API_BASE_URL` | URL base de la API (ej. `https://moldline-api-xxx.run.app`) |
| `VITE_WS_URL` | URL base del WebSocket (ej. `wss://xxx.run.app`; el código añade `/ws`) |

**Ejemplo para desarrollo local:**
```env
VITE_API_BASE_URL=http://localhost:18000
VITE_WS_URL=ws://localhost:18000
```

**Ejemplo para API en Cloud Run:**
```env
VITE_API_BASE_URL=https://moldline-api-xxx.run.app
VITE_WS_URL=wss://moldline-api-xxx.run.app
```

Sustituye `moldline-api-xxx.run.app` por la URL que muestra el script de deploy. Las URLs se incrustan en el build; si cambias la API, hay que recompilar el frontend.

Para **probar en local** el frontend contra la API en Cloud: `npm run dev:cloud` (usa `web/.env.cloud`).

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
GET /conversations
# Headers: x-user-id
# Lista todas las conversaciones del usuario

GET /conversations/:convoId/messages
# Headers: x-user-id
# Lista mensajes de una conversación

POST /conversations/:convoId/messages
# Headers: x-user-id
# Body: { "text": "string" }
# Envía un mensaje
```

### WebSocket

#### Conexión
```javascript
const ws = new WebSocket('ws://localhost:18000/ws?userId=<userId>');

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
- **Backend**: TypeScript + Arquitectura Hexagonal + Express + WebSocket
- **Frontend**: Vite + React + TypeScript
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

#### moldline-api-v2 (Backend)
```env
PORT=18000
```

#### web (Frontend)
```env
VITE_API_BASE_URL=http://localhost:18000
VITE_WS_URL=ws://localhost:18000
```

### Docker Compose

El proyecto utiliza una red externa `web-proxy` para integración con otros servicios:

```yaml
networks:
  web-proxy:
    external: true
```

## 🧪 Testing

Para verificar la API:
```bash
curl http://localhost:18000/health
curl -H "x-user-id: a" http://localhost:18000/conversations
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

- [Deploy del Frontend](./web/README-deploy.md)

---

**¿Por qué este proyecto?**

MoldLine es un experimento para explorar cómo los agentes de IA pueden participar en el desarrollo de software end-to-end, desde la arquitectura hasta la implementación, manteniendo buenas prácticas y patrones de diseño.

---

## 🚀 Deploy

Este proyecto usa **Nginx** como reverse proxy en producción (SSL con Certbot). Los contenedores Docker sirven API y Web.

### Producción con Nginx + SSL

1. **Crear red Docker** (si no existe):
   ```bash
   docker network create web-proxy
   ```

2. **Levantar contenedores**:
   ```bash
   git pull
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
   ```

3. **Configurar Nginx** en el servidor:
   - Copiar `nginx/moldline.conf.example` a `/etc/nginx/sites-available/moldline`
   - Enlazar: `sudo ln -s /etc/nginx/sites-available/moldline /etc/nginx/sites-enabled/`
   - Si Nginx corre en Docker, conectarlo a la red: `docker network connect web-proxy <container_nginx>`
   - Si Nginx corre en el host, los contenedores deben exponer puertos; editar el example para usar `127.0.0.1:5173` y `127.0.0.1:18000`

4. **Certificados SSL** con Certbot:
   ```bash
   sudo certbot --nginx -d chat.moldline.space -d api.moldline.space
   ```

5. **Recargar Nginx**:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

### Estructura de Archivos

```
MoltLine/
├── deploy.sh              # Deploy en el servidor (ejecutar en SSH)
├── deploy-remote.sh       # Deploy desde tu máquina local
├── docker-compose.yml     # Servicios backend
├── web/                   # Frontend (Vite + React)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── moldline-api-v2/       # Backend (TypeScript + Hexagonal)
    └── src/
```

### Opción 1: Deploy desde el Servidor (SSH)

Conéctate al servidor y ejecuta:

```bash
# Deploy completo (backend + frontend)
./deploy.sh all

# Solo backend
./deploy.sh backend

# Solo frontend
./deploy.sh frontend
```

### Opción 2: Deploy Remoto (desde tu máquina local)

Desde tu máquina local con gcloud configurado:

```bash
# Deploy completo
./deploy-remote.sh all

# Solo backend
./deploy-remote.sh backend

# Solo frontend
./deploy-remote.sh frontend
```

El script te pedirá un mensaje de commit. Si no quieres commitear, solo presiona Enter.

### Workflow Recomendado

```bash
# 1. Hacer cambios en tu código local
# (editar archivos en web/ y moldline-api-v2/)

# 2. Probar localmente
# Terminal 1: cd moldline-api-v2 && npm run dev
# Terminal 2: cd web && npm run dev
# Abrir http://localhost:5173

# 3. Deploy a producción
./deploy-remote.sh all  # o 'frontend' o 'backend' según necesites
```

### Deploy Manual (sin scripts)

```bash
cd ~/chat-stack  # o MoltLine
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Todo (API + Web) va en Docker. Nginx en el servidor hace reverse proxy hacia los contenedores.

### Verificar Deploy

```bash
# Backend (contenedores)
docker-compose ps
docker-compose logs -f chat-api
docker-compose logs -f chat-web

# Frontend
curl https://chat.moldline.space
```

### URLs de Producción

- 🎨 **Frontend**: https://chat.moldline.space
- 📡 **API v2**: https://api.moldline.space
- 🔌 **WebSocket**: wss://api.moldline.space/ws

### Stack de Producción

- **Nginx**: reverse proxy + SSL (Certbot/Let's Encrypt)
- **Docker**: API (chat-api) + Web (chat-web)
- **Red**: `web-proxy` para que Nginx alcance los contenedores

