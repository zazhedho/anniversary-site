# Compact Context Guide

Panduan ini dibuat supaya saat context percakapan terpotong (compact), engineer/agent tetap bisa memahami sistem secara cepat dan konsisten.

## 1) Prinsip Produk yang Wajib Dijaga

1. Backend dan frontend **berjalan terpisah**.
2. Backend **tidak** serve frontend; frontend hanya hit URL API backend.
3. Data konten anniversary mendukung storage `json` (file) atau `db` (Postgres) via env `ANNIVERSARY_STORE`.
4. Akses menu/fitur ditentukan oleh **permission (resource+action)**, bukan role hardcoded.
5. Role boleh fleksibel, tetapi evaluasi akses UI/API tetap berbasis permission.
6. Public page harus responsif mobile.
7. Konten anniversary kini mendukung bilingual `id` dan `en`.

## 2) Peta Struktur Repo

Backend (Go):
- `main.go`: bootstrap app, mode runtime, init routes.
- `internal/router/router.go`: registrasi semua endpoint.
- `internal/handlers/http/*`: HTTP handler per domain.
- `internal/services/*`: business logic.
- `internal/repositories/*`: akses data (DB/Redis/JSON).
- `internal/dto/*`: kontrak request/response.
- `migrations/*`: schema + seed permission/menu.
- `data/anniversary.json`: sumber konten anniversary untuk mode `ANNIVERSARY_STORE=json`.

Frontend (React + TS + Tailwind):
- `frontend/src/App.tsx`: route utama aplikasi.
- `frontend/src/contexts/AuthContext.tsx`: auth + permission state.
- `frontend/src/contexts/LocaleContext.tsx`: i18n `id/en`.
- `frontend/src/contexts/NotificationContext.tsx`: global toast notification.
- `frontend/src/services/*`: API client per domain.
- `frontend/src/pages/*`: halaman per fitur.
- `frontend/src/components/common/*`: layout, guard, footer, language switcher.

## 3) Mode Runtime

`ENABLE_ADMIN_API=false`:
- Hanya API anniversary public/setup + frontend public/setup flow.

`ENABLE_ADMIN_API=true`:
- Menyalakan API admin RBAC (`/api/user`, `/api/roles`, `/api/permissions`, `/api/menus`, dst).
- Butuh DB (Postgres), dan Redis untuk session endpoint tambahan.

`ANNIVERSARY_STORE`:
- `json` (default): setup/public anniversary membaca dan menulis file `data/anniversary.json`.
- `db`: setup/public anniversary membaca dan menulis tabel `anniversary_site_configs`.

Referensi:
- `main.go`
- `.env.example`

## 4) Endpoint Inti Anniversary

Public:
- `GET /api/public/anniversary?lang=id|en`
- `GET /api/public/anniversary/moments?lang=id|en`

Setup (token protected):
- `GET /api/setup/anniversary`
- `PUT /api/setup/anniversary`
- `PUT /api/setup/anniversary/moments`
- `POST /api/setup/anniversary/moments`
- `DELETE /api/setup/anniversary/moments/:year`

Auth setup token:
- Header `X-Setup-Token: <token>`
- atau `Authorization: Bearer <token>`

Referensi:
- `internal/router/router.go`
- `internal/handlers/http/anniversary/handler.go`

## 5) Kontrak Data Bilingual

### Format field teks

Field teks setup menerima:
1. String biasa, contoh: `"hero_title": "My another Z"`
2. Object localized, contoh:
```json
{
  "hero_title": {
    "id": "Judul Indonesia",
    "en": "English Title"
  }
}
```

### Perilaku parser

- `LocalizedText` mendukung unmarshal string maupun object.
- Jika salah satu bahasa kosong, akan fallback ke yang tersedia.
- Public payload selalu dikembalikan sebagai string sesuai `lang`.

Referensi:
- `internal/dto/anniversary.go`
- `internal/services/anniversary/payload.go`
- `internal/repositories/anniversary/store_json.go`

## 6) Alur Anniversary di Backend

1. Handler membaca `lang` query (`id` default, `en` jika valid).
2. Service load config JSON dari repository.
3. Repository sanitize config:
   - fallback default,
   - validasi tanggal,
   - sort annual moments by year.
4. Service membentuk public payload:
   - resolve localized text sesuai bahasa,
   - hitung next anniversary + countdown (hari/jam/menit/detik),
   - progressive reveal momen: momen tahun di atas fase saat ini disembunyikan.

Referensi:
- `internal/handlers/http/anniversary/handler.go`
- `internal/services/anniversary/service.go`
- `internal/services/anniversary/payload.go`
- `internal/repositories/anniversary/store_json.go`
- `internal/repositories/anniversary/store_db.go`

## 7) Alur Frontend

Routing utama:
- Public: `/anniversary`
- Auth: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected: `/dashboard`, `/users`, `/roles`, `/menus`, `/profile`, `/change-password`, `/setup/anniversary`
- Protected form routes:
  - `/users/new`, `/users/:id/edit`
  - `/roles/new`, `/roles/:id/edit`
  - `/menus/new`, `/menus/:id/edit`

Permission guard:
- Route-level: `ProtectedRoute` + `PermissionRoute`
- Button-level: `hasAccess({resource, action})` di komponen halaman

I18n:
- `LocaleContext` menyimpan pilihan bahasa ke `localStorage` (`anniv_language`)
- Public showcase refetch payload saat bahasa berubah

Setup Anniversary UI:
- Halaman `/setup/anniversary` memakai alur non-teknis: simpan token, load data, edit form per section, lalu save.
- Token setup disimpan lokal di browser (`anniv_setup_token`).
- Editor JSON tetap ada sebagai `advanced mode` (opsional), bukan alur utama user.

Referensi:
- `frontend/src/App.tsx`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/contexts/LocaleContext.tsx`
- `frontend/src/components/anniversary/AnniversaryShowcase.tsx`
- `frontend/src/services/publicService.ts`

## 8) Permission-Driven Access (Bukan Role-Driven)

Permission menggunakan pasangan `resource + action`.
Contoh yang dipakai UI:
- `dashboard:view`
- `users:list`, `users:create`, `users:update`
- `roles:list`, `roles:create`, `roles:update`, `roles:delete`, `roles:assign_permissions`, `roles:assign_menus`
- `menus:list`, `menus:create`, `menus:update`, `menus:delete`
- `profile:view`, `profile:update`, `profile:update_password`

Sumber permission:
- Endpoint `GET /api/permissions/me`
- Seed migration sinkron:
  - `migrations/000005_sync_rbac_permissions.up.sql`

Catatan:
- Role hanya grouping permission.
- Jangan hardcode akses berdasarkan nama role di frontend/backend.

## 9) Frontend dan Backend Tetap Independen

Backend:
- Env: `.env`
- Dockerfile: `./Dockerfile`

Frontend:
- Env: `frontend/.env`
- Dockerfile: `frontend/Dockerfile`

Frontend hit backend via:
- `VITE_API_BASE_URL` (jika kosong, gunakan relative `/api/...`).

## 10) Checklist Recovery Saat Compact Context

Urutan baca tercepat:
1. `README.md`
2. `docs/COMPACT_CONTEXT_GUIDE.md` (dokumen ini)
3. `main.go`
4. `internal/router/router.go`
5. `internal/dto/anniversary.go`
6. `internal/services/anniversary/payload.go`
7. `internal/repositories/anniversary/store_json.go`
8. `frontend/src/App.tsx`
9. `frontend/src/contexts/AuthContext.tsx`
10. `frontend/src/contexts/LocaleContext.tsx`
11. `frontend/src/contexts/NotificationContext.tsx`
12. `frontend/src/components/anniversary/AnniversaryShowcase.tsx`
13. `frontend/src/pages/roles/RoleListPage.tsx`
14. `frontend/src/pages/roles/RoleFormPage.tsx`
15. `frontend/src/pages/menus/MenuListPage.tsx`
16. `frontend/src/pages/menus/MenuFormPage.tsx`
17. `migrations/000005_sync_rbac_permissions.up.sql`
18. `migrations/000006_create_anniversary_site_configs_table.up.sql`

## 11) Quick Commands

Backend:
```bash
cp .env.example .env
go test ./...
go run .
```

Frontend:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Build check:
```bash
go test ./...
cd frontend && npm run build
```

## 12) Dampak Jika Menambah Fitur

Jika menambah field setup anniversary:
1. Update DTO di `internal/dto/anniversary.go`.
2. Update sanitize default/fallback di `internal/repositories/anniversary/store_json.go`.
3. Update mapper public payload di `internal/services/anniversary/payload.go`.
4. Update tipe frontend di `frontend/src/types/anniversary.ts`.
5. Update setup/public service frontend jika kontrak berubah.
6. Validasi dengan `go test ./...` dan `npm run build`.

Jika menambah menu/tombol admin:
1. Tambah permission seed `resource/action` di migration sinkron.
2. Lindungi endpoint backend dengan `PermissionMiddleware(resource, action)`.
3. Lindungi route + tombol frontend memakai `hasAccess`.
4. Jangan kontrol akses berdasarkan role name.

## 13) Rule Ukuran File (Mulai Sekarang)

1. File baru **tidak boleh** lebih dari 500 baris.
2. Untuk file lama yang saat ini sudah >500 baris: **boleh dibiarkan** (tidak wajib langsung dipecah).
3. Saat menambah fitur baru, prioritaskan pecah logic ke modul/komponen kecil agar file tetap mudah dibaca.
