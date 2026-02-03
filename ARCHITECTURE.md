# Architecture (draft)

## Suggested stack
- Frontend: Next.js or Vite+React
- Backend: Node.js (Fastify/Express) or Python (FastAPI)
- Realtime: WebSocket
- DB: SQLite initially, Postgres later

## Core entities
- User
- Conversation (1:1)
- Room
- Message

## MVP endpoints
- POST /auth/dev-login
- POST /messages/send
- GET /messages/thread/:id
- POST /rooms
- POST /rooms/:id/join
