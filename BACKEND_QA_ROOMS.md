# Backend QA — Rooms (MVP)

## Endpoints

### Create room
- [ ] `POST /rooms` with body `{ "name": "My room" }` and header `x-user-id: a`
- [ ] Response has `{ roomId, name }`
- [ ] Name validation: empty/whitespace rejected, >80 chars rejected

### List rooms
- [ ] `GET /rooms` returns created room(s)

### Join room
- [ ] `POST /rooms/:roomId/join` with `x-user-id: b`
- [ ] Response includes `members` containing `a` and `b`
- [ ] Join is idempotent (calling twice does not duplicate member)

### Send room message (reuses conversations endpoint)
- [ ] `POST /conversations/:roomId/messages` with `x-user-id: a` and `{ text: "hi" }` works
- [ ] Non-member cannot send (403/404 depending on implementation)

## WebSocket fanout
- [ ] Connect WS as `a` and `b`
- [ ] Send room message; both receive `type=message` with `convoId=roomId`

## Regression — DMs
- [ ] `POST /dm` works for a↔b
- [ ] DM messages still deliver via WS

## Restart behavior
- [ ] Known limitation: in-memory store; restart wipes rooms/messages.
