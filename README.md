# Anniversary Site

[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](#)
[![Gin](https://img.shields.io/badge/Gin-API-009688)](#)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-supported-336791?logo=postgresql&logoColor=white)](#)

Anniversary website with:
- public romantic experience (`/anniversary`, `/anniversary/game`, `/anniversary/showcase`)
- setup CMS-like flow for non-technical users (`/setup/anniversary`)
- optional admin RBAC modules (Users, Roles, Menus, Profile)

Backend and frontend run independently. Frontend only consumes backend APIs.

## Table Of Contents
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start (Public + Setup, No DB)](#quick-start-public--setup-no-db)
- [Quick Start (Admin Mode with DB)](#quick-start-admin-mode-with-db)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Docker](#docker)
- [Permissions Model](#permissions-model)
- [Troubleshooting](#troubleshooting)
- [Additional Docs](#additional-docs)

## Core Features

### Public experience
- Cover page and interactive journey flow
- Yes/No mini game + branching romantic lines
- Chapter flow: surprise, voice note, memory unlock, photos, videos
- Bilingual (`id` / `en`)
- Countdown and elapsed-marriage timer
- Memory map with real coordinates + Google Maps link

### Setup experience
- Token-based setup API (no login required)
- Friendly form-based editor + advanced JSON mode
- Media upload (`photo`, `video`, `poster`, `audio`)
- Config can be stored in JSON file or PostgreSQL

### Admin (optional)
- Users, Roles, Menus, Profile
- Permission-driven UI/API access (`resource + action`)
- Session and Redis-based security features (when enabled)

## Architecture

```text
Frontend (React + TS + Tailwind)
        |
        | HTTP (REST)
        v
Backend (Go + Gin)
        |
        +-- JSON store (data/anniversary.json)
        |
        +-- PostgreSQL store (anniversary_site_configs)
        |
        +-- Object storage (MinIO / R2) for media
```

## Project Structure

```text
anniversary-site/
├── main.go
├── .env.example
├── Dockerfile                 # backend image
├── data/anniversary.json      # default JSON content
├── docs/COMPACT_CONTEXT_GUIDE.md
├── internal/
│   ├── handlers/http/
│   ├── services/
│   ├── repositories/
│   ├── dto/
│   └── router/
├── migrations/
└── frontend/
    ├── .env.example
    ├── Dockerfile             # frontend image
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── services/
    │   ├── contexts/
    │   └── types/
    └── package.json
```

## Quick Start (Public + Setup, No DB)

Recommended for first local run.
This mode does not require PostgreSQL/Redis.

### 1) Backend

```bash
cp .env.example .env
go mod tidy
go run . -migrate=false
```

API will run on `http://localhost:8080`.

Required `.env` values for truly no-DB mode:
- `ENABLE_ADMIN_API=false`
- `ANNIVERSARY_STORE=json`

Why `-migrate=false`:
- this mode uses JSON storage
- avoids failing startup when PostgreSQL is not available locally
- default `go run .` still runs DB migration on startup

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Quick Start (Admin Mode with DB)

Use this mode if you need RBAC modules (`/users`, `/roles`, `/menus`) and DB-backed anniversary config.

1. Set in `.env`:
   - `ENABLE_ADMIN_API=true`
   - `ANNIVERSARY_STORE=db`
   - valid DB and Redis config
2. Run backend normally:

```bash
go run .
```

3. Run frontend:

```bash
cd frontend
npm run dev
```

## Environment Variables

### Backend (`.env`)

Important keys:

| Key | Example | Description |
|---|---|---|
| `PORT` | `8080` | API port |
| `ENABLE_ADMIN_API` | `false` / `true` | enable or disable admin RBAC routes |
| `ANNIVERSARY_STORE` | `json` / `db` | config storage mode |
| `ANNIVERSARY_DATA_FILE` | `./data/anniversary.json` | JSON storage path |
| `SETUP_API_ENABLED` | `true` | setup API switch |
| `SETUP_TOKEN` | `change-this-setup-token` | setup token |
| `ANNIVERSARY_UPLOAD_MAX_MB` | `50` | max upload size |
| `STORAGE_PROVIDER` | `minio` / `r2` | upload provider |

DB/Redis values are required when:
- `ENABLE_ADMIN_API=true`
- or `ANNIVERSARY_STORE=db`
- or backend is started with migration enabled (`go run .` default or `RUN_MIGRATION=true`)

### Frontend (`frontend/.env`)

| Key | Example | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | backend base URL |

## API Overview

### Public APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/public/anniversary?lang=id|en` | full public payload |
| `GET` | `/api/public/anniversary/moments?lang=id|en` | yearly moments only |

### Setup APIs (token protected)

Auth header:
- `X-Setup-Token: <SETUP_TOKEN>`
- or `Authorization: Bearer <SETUP_TOKEN>`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/setup/anniversary` | get setup config |
| `PUT` | `/api/setup/anniversary` | update setup config |
| `PUT` | `/api/setup/anniversary/moments` | replace moments |
| `POST` | `/api/setup/anniversary/moments` | add moment |
| `DELETE` | `/api/setup/anniversary/moments/:year` | delete moment |
| `POST` | `/api/setup/anniversary/media/upload` | upload media |

Upload payload:
- `file`: multipart file
- `type`: `photo` | `video` | `poster` | `audio`

### Admin APIs (when `ENABLE_ADMIN_API=true`)

Main groups:
- `/api/user/*`
- `/api/roles`, `/api/role/*`
- `/api/permissions`, `/api/permission/*`
- `/api/menus`, `/api/menu/*`

## Docker

### Backend

```bash
docker build -t anniversary-site-backend .
docker run --rm -p 8080:8080 --env-file .env anniversary-site-backend
```

### Frontend

```bash
cd frontend
docker build -t anniversary-site-frontend .
docker run --rm -p 5173:80 anniversary-site-frontend
```

Note:
- frontend container is static build served by Nginx
- `VITE_API_BASE_URL` is build-time value

## Permissions Model

Access control uses permission pairs (`resource`, `action`), not hardcoded role names.

Examples:
- `users:list`, `users:create`, `users:update`, `users:delete`
- `roles:list`, `roles:assign_permissions`, `roles:assign_menus`
- `menus:list`, `menus:update`
- `profile:view`, `profile:update`, `profile:update_password`

## Troubleshooting

### `Error app environment`

Backend cannot load env config.

Fix:
```bash
cp .env.example .env
```

### Frontend hot reload not updating

Use polling mode:
```bash
cd frontend
npm run dev:poll
```

### Setup API returns unauthorized

Make sure header contains valid token:
```bash
X-Setup-Token: <SETUP_TOKEN>
```

### Public page still old after update

Check storage mode:
- `ANNIVERSARY_STORE=json` -> update `data/anniversary.json`
- `ANNIVERSARY_STORE=db` -> update via setup API/UI (DB becomes source of truth)

### Still trying DB while using `ANNIVERSARY_STORE=json`

Check all of these:
- `ENABLE_ADMIN_API=false`
- run backend with `go run . -migrate=false`
- if using container, set `RUN_MIGRATION=false`

## Additional Docs

- [Compact Context Guide](docs/COMPACT_CONTEXT_GUIDE.md)
