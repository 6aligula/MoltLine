# Persistence - MoldLine API v2

## Modos

1. RAM only (default): sin env extra; se pierde estado en reinicio/scale-to-zero.
2. RAM + Firestore sync: `CHAT_PERSIST_FIRESTORE=true` (recomendado).
3. Firestore primary: `CHAT_USE_FIRESTORE=true` o `CHAT_CONVOS_DRIVER=firebase`.

## Credenciales Firebase

- `GOOGLE_APPLICATION_CREDENTIALS`, o
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PRIVATE_KEY_ID`.

En Cloud Run: validar permisos Firestore en la service account.

## Invariante DM

- Mismo par de usuarios => mismo `convoId` (determinista).

## Log de arranque

- `Convos: RAM only`
- `Convos: RAM + Firestore sync`
- `Convos: Firestore primary`
