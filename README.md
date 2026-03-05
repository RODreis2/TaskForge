# TaskForge

TaskForge is a task workspace application for organizing work and capturing ideas in one place.

## What the project does

TaskForge allows users to:
- create an account and authenticate securely
- create and manage tasks
- organize tasks in folders/tree structures
- open task workspaces with text and drawing content
- edit task documents that combine notes and freehand sketches

## High-level view

The project is built as a monorepo with:
- a user service for authentication and account management
- a task service for tasks, folders, blocks, and documents
- a web frontend for login, registration, and dashboard workflows
- an API gateway that routes frontend and backend traffic through one entrypoint

## How to run

### Recommended: Docker Compose

1. Generate JWT keys:
```bash
openssl genpkey -algorithm ED25519 -out infra/keys/private.pem
openssl pkey -in infra/keys/private.pem -pubout -out infra/keys/public.pem
```

2. Start everything:
```bash
docker compose up --build
```

3. Open:
- `http://localhost:8088`

### Optional: run services locally

Requirements:
- JDK 21
- Node.js 20+
- PostgreSQL

Run backend services:
```bash
cd backend/user-service && ./mvnw spring-boot:run
cd backend/task-service && ./mvnw spring-boot:run
```

Run frontend:
```bash
cd frontend/web
npm install
npm start
```
