# Testing Guide - MoldLine API v2

Smoke test minimo para cambios de backend.

## 1) Build y run

```bash
cd moldline-api-v2
npm run build
npm run dev
```

## 2) Health

```bash
curl -s http://localhost:18000/health
```

## 3) Flujo DM (Bearer JWT)

Define token (ejemplo):

```bash
TOKEN='<jwt>'
```

Crear DM:

```bash
curl -s -X POST http://localhost:18000/dm -H 'content-type: application/json' -H "authorization: Bearer $TOKEN" -d '{"otherUserId":"b"}'
```

Listar conversaciones:

```bash
curl -s http://localhost:18000/conversations -H "authorization: Bearer $TOKEN"
```

Enviar mensaje:

```bash
curl -s -X POST http://localhost:18000/conversations/<convoId>/messages -H 'content-type: application/json' -H "authorization: Bearer $TOKEN" -d '{"text":"hola"}'
```

## 4) WS

Conectar `ws://localhost:18000/ws?token=<jwt>`, validar eventos `hello` y `message`.

## 5) Errores minimos

- `/dm` sin `otherUserId` -> `400`
- endpoint protegido sin auth -> `401`
- `messages` fuera de membresia -> `404`
