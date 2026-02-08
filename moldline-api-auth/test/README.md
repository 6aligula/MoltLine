# Tests Auth API

Pruebas de los endpoints sin usar Postman.

## Requisitos

- `curl`
- (Opcional) `bash` para el script

## Uso

### Probar API desplegada (Cloud Run)

```bash
cd moldline-api-auth/test
chmod +x auth-api-test.sh
./auth-api-test.sh
```

Por defecto usa: `https://moldline-auth-gjoom7xsla-no.a.run.app`

### Probar otra URL

```bash
./auth-api-test.sh https://tu-url.run.app
# o
BASE_URL=http://localhost:8080 ./auth-api-test.sh
```

### Probar API local

Con el servidor levantado en otra terminal (`npm run dev`):

```bash
BASE_URL=http://localhost:8080 ./auth-api-test.sh
```

## Qué prueba el script

1. **GET /health** — 200, `{ "status": "ok", "service": "auth" }`
2. **POST /register** — 201 y token (o 409 si el usuario ya existe → hace login)
3. **GET /me** — 200 con perfil usando el token
4. **POST /refresh** — 200 y nuevo token
5. **GET /users** — 200 con lista de usuarios
6. **POST /login** — 200 con el usuario de prueba
7. **POST /register** sin `name` — 400 validación
8. **GET /me** sin token — 401

Si algún paso falla, el script termina con código de salida 1.

### Si POST /register devuelve 500 (desplegado)

En Cloud Run suele faltar configuración:

- **JWT_SECRET**: variable de entorno con un valor de al menos 32 caracteres.
- **Firestore**: la cuenta de servicio de Cloud Run debe tener rol que permita leer/escribir en Firestore (por ejemplo "Cloud Datastore User" si usas Firestore en modo Native).

Mientras tanto puedes probar el resto de endpoints con un usuario ya creado:

```bash
TEST_USER=miUsuario TEST_PASS_OPT=miPassword ./auth-api-test.sh
```
