#!/usr/bin/env bash
# Prueba los endpoints de la MoldLine Auth API (local o desplegada).
# Uso: ./auth-api-test.sh [BASE_URL]
# Ejemplo: ./auth-api-test.sh
#          ./auth-api-test.sh https://moldline-auth-xxxxx.run.app
#          BASE_URL=http://localhost:8080 ./auth-api-test.sh

set -e
BASE_URL="${1:-${BASE_URL:-https://moldline-auth-gjoom7xsla-no.a.run.app}}"
TEST_NAME="testuser_$(date +%s)"
TEST_PASS="testpass123"

echo "=========================================="
echo "MoldLine Auth API — Test de endpoints"
echo "BASE_URL: $BASE_URL"
echo "=========================================="
echo ""

# 1. Health
echo "1. GET /health"
HEALTH=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HTTP=$(echo "$HEALTH" | tail -n1)
BODY=$(echo "$HEALTH" | sed '$d')
if [ "$HTTP" = "200" ]; then
  echo "   OK $HTTP — $BODY"
else
  echo "   FAIL $HTTP — $BODY"
  exit 1
fi
echo ""

# 2. Register
echo "2. POST /register (name=$TEST_NAME)"
REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEST_NAME\",\"password\":\"$TEST_PASS\",\"email\":\"test@test.com\"}")
HTTP=$(echo "$REGISTER" | tail -n1)
BODY=$(echo "$REGISTER" | sed '$d')
if [ "$HTTP" = "201" ]; then
  echo "   OK $HTTP"
  TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "   Token recibido: ${TOKEN:0:30}..."
elif [ "$HTTP" = "409" ]; then
  echo "   Usuario ya existe (409), intentando login..."
  LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TEST_NAME\",\"password\":\"$TEST_PASS\"}")
  HTTP_LOGIN=$(echo "$LOGIN" | tail -n1)
  BODY_LOGIN=$(echo "$LOGIN" | sed '$d')
  if [ "$HTTP_LOGIN" = "200" ]; then
    TOKEN=$(echo "$BODY_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   OK — Token obtenido por login: ${TOKEN:0:30}..."
  else
    echo "   FAIL login $HTTP_LOGIN — $BODY_LOGIN"
    exit 1
  fi
elif [ "$HTTP" = "500" ] && [ -n "${TEST_USER:-}" ] && [ -n "${TEST_PASS_OPT:-}" ]; then
  echo "   Register 500 (revisar Firestore/JWT en Cloud Run). Intentando login con TEST_USER..."
  LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/login" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$TEST_USER\",\"password\":\"$TEST_PASS_OPT\"}")
  HTTP_LOGIN=$(echo "$LOGIN" | tail -n1)
  BODY_LOGIN=$(echo "$LOGIN" | sed '$d')
  if [ "$HTTP_LOGIN" = "200" ]; then
    TOKEN=$(echo "$BODY_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   OK — Token obtenido por login: ${TOKEN:0:30}..."
  else
    echo "   FAIL login $HTTP_LOGIN — $BODY_LOGIN"
    exit 1
  fi
else
  echo "   FAIL $HTTP — $BODY"
  if [ "$HTTP" = "500" ]; then
    echo "   (Si está desplegado: revisa JWT_SECRET y permisos Firestore en Cloud Run)"
  fi
  exit 1
fi
echo ""

if [ -z "$TOKEN" ]; then
  echo "   No se obtuvo token; abortando."
  exit 1
fi

# 3. Me
echo "3. GET /me (Authorization: Bearer ...)"
ME=$(curl -s -w "\n%{http_code}" "$BASE_URL/me" -H "Authorization: Bearer $TOKEN")
HTTP=$(echo "$ME" | tail -n1)
BODY=$(echo "$ME" | sed '$d')
if [ "$HTTP" = "200" ]; then
  echo "   OK $HTTP — $BODY"
else
  echo "   FAIL $HTTP — $BODY"
  exit 1
fi
echo ""

# 4. Refresh
echo "4. POST /refresh"
REFRESH=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/refresh" -H "Authorization: Bearer $TOKEN")
HTTP=$(echo "$REFRESH" | tail -n1)
BODY=$(echo "$REFRESH" | sed '$d')
if [ "$HTTP" = "200" ]; then
  NEW_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  [ -n "$NEW_TOKEN" ] && TOKEN="$NEW_TOKEN"
  echo "   OK $HTTP — nuevo token recibido"
else
  echo "   FAIL $HTTP — $BODY"
  exit 1
fi
echo ""

# 5. Users
echo "5. GET /users"
USERS=$(curl -s -w "\n%{http_code}" "$BASE_URL/users" -H "Authorization: Bearer $TOKEN")
HTTP=$(echo "$USERS" | tail -n1)
BODY=$(echo "$USERS" | sed '$d')
if [ "$HTTP" = "200" ]; then
  echo "   OK $HTTP — lista de usuarios (primeros 200 chars): ${BODY:0:200}..."
else
  echo "   FAIL $HTTP — $BODY"
  exit 1
fi
echo ""

# 6. Login (con el usuario de prueba)
echo "6. POST /login (mismo usuario)"
LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEST_NAME\",\"password\":\"$TEST_PASS\"}")
HTTP=$(echo "$LOGIN" | tail -n1)
if [ "$HTTP" = "200" ]; then
  echo "   OK $HTTP — login correcto"
else
  echo "   FAIL $HTTP — $(echo "$LOGIN" | sed '$d')"
fi
echo ""

# 7. Validación: register sin name
echo "7. POST /register (validación: sin name) — esperado 400"
BAD=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"password":"abc"}')
HTTP=$(echo "$BAD" | tail -n1)
if [ "$HTTP" = "400" ]; then
  echo "   OK $HTTP — validación correcta"
else
  echo "   Got $HTTP (esperado 400)"
fi
echo ""

# 8. Me sin token — esperado 401
echo "8. GET /me sin token — esperado 401"
UNAUTH=$(curl -s -w "\n%{http_code}" "$BASE_URL/me")
HTTP=$(echo "$UNAUTH" | tail -n1)
if [ "$HTTP" = "401" ]; then
  echo "   OK $HTTP — no autorizado sin token"
else
  echo "   Got $HTTP (esperado 401)"
fi
echo ""

echo "=========================================="
echo "Todos los checks pasaron."
echo "=========================================="
