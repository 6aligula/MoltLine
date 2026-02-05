# MoldLine Chat - Frontend Web

Frontend de la aplicación de chat MoldLine.

## 🛠️ Stack Tecnológico

- **Framework**: Vite + React
- **Lenguaje**: TypeScript
- **UI**: Componentes custom
- **WebSocket**: Cliente para chat en tiempo real
- **HTTP**: REST API client

## 🚀 Desarrollo Local

### Instalación

```bash
npm install
```

### Desarrollo (Hot Reload)

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:5173

### Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en `dist/`

### Preview del Build

```bash
npm run preview
```

## 📁 Estructura

```
web/
├── src/
│   ├── lib/              # WebSocket y API clients
│   ├── App.tsx           # Componente principal
│   └── main.tsx          # Entry point
│
├── public/               # Assets estáticos
├── index.html            # HTML template
└── vite.config.ts        # Configuración Vite
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` (opcional):

```env
VITE_API_URL=https://api.moldline.space
VITE_WS_URL=ws://localhost:8787
```

### Endpoints

Por defecto, la aplicación conecta a:

- **API REST**: Backend API v2
- **WebSocket**: Backend chat-web (puerto 8787)

## 📦 Deploy

### Desde el servidor

```bash
cd ~/chat-stack
./deploy.sh frontend
```

### Desde tu máquina local

```bash
./deploy-remote.sh frontend
```

Los archivos se copiarán a `/var/www/chat/` y estarán disponibles en https://chat.moldline.space

## 🧪 Testing

```bash
# Lint
npm run lint
```

## 📝 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Preview del build
- `npm run lint` - Ejecutar linter

## 🔗 Links Útiles

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 📖 Características

- **Salas de chat**: Crear y unirse a salas
- **Mensajería 1:1**: Conversaciones directas
- **Tiempo real**: WebSocket para mensajes instantáneos
- **Lista de usuarios**: Ver usuarios conectados
- **Lista de salas**: Ver salas disponibles
