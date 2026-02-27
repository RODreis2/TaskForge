# TaskForge Monorepo

## Structure

- `backend/user-service`: authentication and user management (Spring Boot)
- `backend/task-service`: task and block management (Spring Boot)
- `frontend/web`: Angular frontend (Tailwind CSS)
- `infra/nginx`: API Gateway (Nginx)
- `infra/keys`: RSA keys used by JWT signing/validation

## Local run with Docker Compose

1. Generate RSA keys in `infra/keys`:

```bash
openssl genpkey -algorithm RSA -out infra/keys/private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in infra/keys/private.pem -pubout -out infra/keys/public.pem
```

2. Start all services:

```bash
docker compose up --build
```

3. Access app and APIs:

- Frontend + gateway: `http://localhost:8088`
- User service (internal via gateway): `/api/users/*`
- Task service (internal via gateway): `/api/tasks/*`

## Auth flow

- `POST /api/users/login` sets `access_token` cookie (`HttpOnly`, `SameSite=Lax`).
- Frontend sends requests with `withCredentials: true`.
- Gateway reads the cookie and forwards `Authorization: Bearer <token>` to task service routes.
- `POST /api/users/logout` expires the cookie.
- `GET /api/users/me` resolves current authenticated user.

## Frontend MVP pages

- `/login`
- `/register`
- `/dashboard` (protected): create task and add block
