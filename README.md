# anniversary-site

Backend + frontend anniversary website.

Struktur (mengacu pola `safety-riding/frontend`):
- backend: root project Go (`main.go`, `internal`, dll.)
- frontend: app React TypeScript + Tailwind (`frontend/src`, `frontend/src/services`, `frontend/src/types`)
- masing-masing punya file env dan Dockerfile sendiri:
`./.env.example` + `./Dockerfile` (backend), `./frontend/.env.example` + `./frontend/Dockerfile` (frontend)

## Run Backend

```bash
cp .env.example .env
go run .
```

Backend API default: `http://localhost:8080`.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://localhost:5173`.

Set backend URL via env:

```bash
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

Atau gunakan proxy default Vite (`/api` -> `http://localhost:8080`).

## Modes

- `ENABLE_ADMIN_API=false`: only anniversary public/setup API + responsive frontend (default).
- `ENABLE_ADMIN_API=true`: also enable existing admin RBAC APIs (needs DB/Redis setup).

## Public API

- `GET /api/public/anniversary`
- `GET /api/public/anniversary/moments`

## Setup API (protected with token)

Pass token via `X-Setup-Token: <SETUP_TOKEN>` or `Authorization: Bearer <SETUP_TOKEN>`.

- `GET /api/setup/anniversary`
- `PUT /api/setup/anniversary`
- `PUT /api/setup/anniversary/moments`
- `POST /api/setup/anniversary/moments`
- `DELETE /api/setup/anniversary/moments/:year`

## Data Source

Default JSON file path: `./data/anniversary.json`.

## Example Update Config

```bash
curl -X PUT http://localhost:8080/api/setup/anniversary \
  -H 'Content-Type: application/json' \
  -H 'X-Setup-Token: change-this-setup-token' \
  --data-binary @data/anniversary.json
```
