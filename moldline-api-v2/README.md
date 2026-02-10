# MoldLine API v2

Backend de mensajeria (REST + WS).

## Quickstart

```bash
cd moldline-api-v2
npm install
npm run dev
```

- API: `http://localhost:18000`
- WS: `ws://localhost:18000/ws`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`

## Env minima

- `PORT` (default `18000`)
- `JWT_SECRET` (Bearer JWT, minimo 32 chars)
- `CHAT_PERSIST_FIRESTORE=true` (RAM + sync Firestore)
- `CHAT_USE_FIRESTORE=true` o `CHAT_CONVOS_DRIVER=firebase` (Firestore primario)

Credenciales Firebase: `GOOGLE_APPLICATION_CREDENTIALS` o `FIREBASE_*`.

## Docs

- `moldline-api-v2/AGENTS.md`
- `moldline-api-v2/docs/API_CONTRACT.md`
- `moldline-api-v2/docs/WS_EVENTS.md`
- `moldline-api-v2/docs/PERSISTENCE.md`
- `moldline-api-v2/docs/TESTING.md`
