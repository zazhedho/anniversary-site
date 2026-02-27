# Frontend (React + TypeScript + Tailwind)

Struktur (mirip safety-riding):
- `src/contexts` untuk auth state
- `src/contexts/NotificationContext.tsx` untuk global toast notification
- `src/services` untuk API client
- `src/components/common` untuk layout/protected route
- `src/pages/auth`, `src/pages/dashboard`, `src/pages/users`, `src/pages/roles`, `src/pages/menus`, `src/pages/anniversary`, `src/pages/system` untuk screen

Route utama:
- `/anniversary` (public)
- `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/dashboard`, `/profile`, `/change-password` (protected)
- `/users`, `/users/new`, `/users/:id/edit` (protected, admin-style flow)
- `/roles`, `/roles/new`, `/roles/:id/edit` (protected, permission-based)
- `/menus`, `/menus/new`, `/menus/:id/edit` (protected, permission-based)
- `/setup/anniversary` (protected, editor JSON setup)

Kontrol menu dan akses route protected menggunakan permission dari backend (bukan hardcoded role),
dengan acuan `resource + action` dari endpoint `GET /api/permissions/me`
(contoh: `dashboard:view`, `users:list`, `users:create`, `profile:view`, `profile:update_password`).
Kontrol tombol aksi juga per permission action:
`Add User -> users:create`, `Edit User -> users:update`, `Save Profile -> profile:update`.
Untuk modul baru:
`Add Role -> roles:create`, `Edit Role -> roles:update`, `Assign Permission -> roles:assign_permissions`,
`Assign Menu -> roles:assign_menus`, `Add Menu -> menus:create`, `Edit Menu -> menus:update`, `Delete Menu -> menus:delete`.

## Local Run

```bash
cp .env.example .env
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Environment

- `VITE_API_BASE_URL` (contoh: `http://localhost:8080`)

Jika kosong, frontend akan menggunakan path relatif (`/api/...`).

## API yang Dipakai

- `POST /api/user/login`
- `POST /api/user/logout`
- `POST /api/user/register`
- `POST /api/user/forgot-password`
- `POST /api/user/reset-password`
- `GET /api/user`
- `PUT /api/user`
- `GET /api/users`
- `GET /api/user/:id`
- `POST /api/user`
- `PUT /api/user/:id`
- `GET /api/roles` (sumber opsi role dinamis)
- `GET /api/role/:id`
- `POST /api/role`
- `PUT /api/role/:id`
- `DELETE /api/role/:id`
- `POST /api/role/:id/permissions`
- `POST /api/role/:id/menus`
- `GET /api/menus`
- `GET /api/menu/:id`
- `POST /api/menu`
- `PUT /api/menu/:id`
- `DELETE /api/menu/:id`
- `GET /api/permissions` (untuk pemilihan assign role)
- `GET /api/permissions/me` (untuk evaluasi akses resource/action)
- `PUT /api/user/change/password`
- `GET /api/public/anniversary`
- `GET /api/setup/anniversary` (`X-Setup-Token`)
- `PUT /api/setup/anniversary` (`X-Setup-Token`)
- `PUT /api/setup/anniversary/moments` (`X-Setup-Token`)
- `POST /api/setup/anniversary/moments` (`X-Setup-Token`)
- `DELETE /api/setup/anniversary/moments/:year` (`X-Setup-Token`)

Pastikan backend dijalankan dengan `ENABLE_ADMIN_API=true` jika ingin memakai endpoint auth (`/api/user/*`).
