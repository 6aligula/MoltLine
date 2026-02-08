# MoldLine Auth API

API de autenticación (registro, login, JWT) para MoldLine. Servicio independiente desplegable en Cloud Run.

## Endpoints

| Método | Ruta       | Auth | Descripción        |
|--------|------------|------|--------------------|
| POST   | /register | No   | Registrar usuario  |
| POST   | /login    | No   | Login              |
| GET    | /me       | Bearer | Perfil usuario   |
| POST   | /refresh  | Bearer | Renovar token     |
| GET    | /users    | Bearer | Listar usuarios   |
| GET    | /health   | No   | Health check       |

## Variables de entorno

- `PORT` (default 8080)
- `AUTH_DB_DRIVER`: `firebase` | `postgres` (default: firebase)
- `JWT_SECRET`: secreto ≥ 32 caracteres (compartir con Chat API)
- `JWT_EXPIRATION`: ej. `24h`
- `BCRYPT_ROUNDS`: ej. 12
- `CORS_ORIGIN`: default `*`
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`: rate limit en /register y /login

Para Firestore (`AUTH_DB_DRIVER=firebase`):

- `GOOGLE_APPLICATION_CREDENTIALS`: ruta al JSON de cuenta de servicio, o
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PRIVATE_KEY_ID`

Para Postgres (futuro): `DATABASE_URL` y `AUTH_DB_DRIVER=postgres`.

## Firestore

- Colección: `users`
- Document ID = nombre normalizado (lowercase, trim) para garantizar unicidad de `name`.
- Índice: crear en Firebase Console índice compuesto para `users`: campo `createdAt` (ascending) para que `listUsers` funcione.

## Desarrollo

```bash
npm install
cp .env.example .env
# Editar .env con JWT_SECRET (≥32 chars) y credenciales Firebase
npm run dev
```

## Build y deploy

```bash
npm run build
./deploy-cloudrun.sh
```

En Cloud Run, configurar las variables de entorno (incl. `JWT_SECRET` y credenciales Firebase).
