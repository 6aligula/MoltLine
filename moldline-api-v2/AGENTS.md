# AGENTS.md - MoldLine API v2

Reglas para agentes que modifiquen `moldline-api-v2`.

## Invariantes

- No romper contratos REST/WS sin actualizar docs y clientes.
- `POST /dm` devuelve `200` tanto en create como en get-or-create.
- DM debe mantener `convoId` determinista por par de usuarios.
- Auth compatible:
  - preferido `Authorization: Bearer <jwt>`
  - fallback `x-user-id`
- Eventos WS estables: `hello`, `message`.

## Arquitectura

- Logica de negocio en `src/application`, no en handlers HTTP.
- Respetar capas (`domain`, `application`, `ports`, `adapters`).
- Validar input con Zod.
- Errores esperados con `AppError`/helpers; sin stack trace en response.

## Persistencia

- Preservar los 3 modos:
  - RAM only
  - RAM + Firestore sync
  - Firestore primary

## Done checklist

1. `npm run build` ok.
2. Flujo DM ok (crear/listar/enviar).
3. WS `hello` y `message` ok.
4. Si hubo cambio de contrato: actualizar `docs/API_CONTRACT.md` y `docs/WS_EVENTS.md`.
