# Frontend (React + TypeScript + Tailwind)

Struktur (mirip safety-riding):
- `src/contexts` untuk auth state
- `src/contexts/NotificationContext.tsx` untuk global toast notification
- `src/services` untuk API client
- `src/components/common` untuk layout/protected route
- `src/pages/auth`, `src/pages/dashboard`, `src/pages/users`, `src/pages/roles`, `src/pages/menus`, `src/pages/anniversary`, `src/pages/system` untuk screen

Route utama:
- `/:slug` (public cover page, main tenant path)
- `/:slug/game` (public interactive flow by tenant)
- `/:slug/showcase` (public showcase by tenant)
- `/app/login`, `/app/register`, `/app/forgot-password`, `/app/reset-password`
- `/app/dashboard`, `/app/profile`, `/app/change-password` (protected)
- `/app/users`, `/app/users/new`, `/app/users/:id/edit` (protected, admin-style flow)
- `/app/roles`, `/app/roles/new`, `/app/roles/:id/edit` (protected, permission-based)
- `/app/menus`, `/app/menus/new`, `/app/menus/:id/edit` (protected, permission-based)
- `/app/tenants`, `/app/tenants/new`, `/app/tenants/:id/edit` (protected, permission-based)
- `/app/setup/anniversary` (protected, editor JSON setup)
- legacy compatibility: `/anniversary*`, `/login`, `/dashboard`, dll akan redirect ke path baru

Kontrol menu dan akses route protected menggunakan permission dari backend (bukan hardcoded role),
dengan acuan `resource + action` dari endpoint `GET /api/permissions/me`
(contoh: `dashboard:view`, `users:list`, `users:create`, `profile:view`, `profile:update_password`).
Kontrol tombol aksi juga per permission action:
`Add User -> users:create`, `Edit User -> users:update`, `Save Profile -> profile:update`.
Untuk modul baru:
`Add Role -> roles:create`, `Edit Role -> roles:update`, `Assign Permission -> roles:assign_permissions`,
`Assign Menu -> roles:assign_menus`, `Add Menu -> menus:create`, `Edit Menu -> menus:update`, `Delete Menu -> menus:delete`.
Tenant module:
`List Tenant -> tenants:list`, `Add Tenant -> tenants:create`, `Edit Tenant -> tenants:update`,
`Delete Tenant -> tenants:delete`, `Cross-tenant switcher -> tenants:access_all`.

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
- `VITE_DEFAULT_PUBLIC_TENANT` (default: `default`)

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
- `GET /api/tenants`
- `GET /api/tenants/:id`
- `POST /api/tenants`
- `PATCH /api/tenants/:id`
- `DELETE /api/tenants/:id`
- `POST /api/tenants/:id/members`
- `GET /api/permissions` (untuk pemilihan assign role)
- `GET /api/permissions/me` (untuk evaluasi akses resource/action)
- `PUT /api/user/change/password`
- `GET /api/public/tenants/:slug/anniversary`
- `GET /api/public/tenants/:slug/anniversary/moments`
- `GET /api/setup/tenants/:slug/anniversary` (`Authorization: Bearer <JWT>`)
- `PUT /api/setup/tenants/:slug/anniversary` (`Authorization: Bearer <JWT>`)
- `PUT /api/setup/tenants/:slug/anniversary/moments` (`Authorization: Bearer <JWT>`)
- `POST /api/setup/tenants/:slug/anniversary/moments` (`Authorization: Bearer <JWT>`)
- `DELETE /api/setup/tenants/:slug/anniversary/moments/:year` (`Authorization: Bearer <JWT>`)
- `POST /api/setup/tenants/:slug/anniversary/media/upload` (`Authorization: Bearer <JWT>`, `type=photo|video|poster|audio`)

Pastikan backend dijalankan dengan `ENABLE_ADMIN_API=true` jika ingin memakai endpoint auth (`/api/user/*`).

Catatan setup cover public:
- Konten halaman `/anniversary` bisa diubah dari setup payload melalui key:
`cover_badge`, `cover_title`, `cover_subtext`, `cover_cta`.
- Seluruh input Setup sudah punya batas karakter (`maxLength`) agar input tetap aman dan konsisten.

Catatan music URL:
- Setup Basic mendukung `Upload Music` (`type=audio`) untuk mengisi `music_url`.
- Jika `music_url` adalah audio direct (`.mp3/.m4a/...`) maka bisa diputar di public showcase.
- Jika `music_url` YouTube maka tampil sebagai embed/open link.
- Jika `music_url` adalah link halaman biasa, UI fallback menjadi tombol `Open Music Link`.

Catatan register:
- Form register kini meminta `tenant_slug` (slug publik tenant milik user).
- Untuk user biasa, slug tenant hanya bisa ditentukan sekali saat create tenant pertama.
