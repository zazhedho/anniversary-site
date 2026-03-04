# Multi-Tenant URL Plan (Path-First)

Dokumen ini menjadi arah implementasi agar `anniversary-site` bisa dipakai banyak pasangan.

Strategi rilis:
1. Fase aktif sekarang: `https://yourapp.com/{slug}`
2. Fase lanjutan (opsional): `https://{slug}.yourapp.com`

Tujuan tambahan:
1. tetap permission-driven (`resource + action`)
2. ada akses global lintas tenant untuk operator platform

Status saat ini:
1. Phase 1 dimulai.
2. Foundation migration disiapkan di `migrations/000007_create_tenants_and_tenantize_anniversary_configs.*.sql`.
3. Phase 2 sudah berjalan: repository/service/handler anniversary tenant-aware + `TenantScopeMiddleware` aktif.

## 1) Keputusan Utama

1. Arsitektur: multi-tenant (`1 tenant = 1 pasangan`).
2. Public URL saat ini pakai path slug (`/{slug}`) agar deployment lebih sederhana.
3. Resolver tenant dibuat hybrid sejak awal supaya nanti bisa pindah ke subdomain tanpa ubah model data.
4. Akses tetap berbasis permission, bukan hardcoded role.
5. Mode produksi multi-tenant wajib `ANNIVERSARY_STORE=db`.

## 2) Tipe User

1. `tenant_owner`: pemilik tenant/pasangan, kelola tenant sendiri.
2. `tenant_member`: anggota tenant, akses sesuai permission.
3. `platform_admin`: operator global, bisa kelola lintas tenant.

Catatan:
1. `platform_admin` tidak di-hardcode sebagai role bypass.
2. Akses global tetap lewat permission khusus `tenants:access_all`.

## 3) URL dan Routing

## 3.1 Fase Path (Implementasi Utama)

1. Public page:
   - `https://yourapp.com/{slug}`
2. Public API (disarankan explicit slug):
   - `GET /api/public/tenants/{slug}/anniversary?lang=en`
3. Setup/Admin API:
   - tenant context dari session + selected tenant
   - untuk user global, tenant dipilih dari tenant switcher

## 3.2 Fase Subdomain (Nanti)

1. Public page:
   - `https://{slug}.yourapp.com`
2. Resolver host diaktifkan sebagai prioritas.
3. Path slug tetap dipertahankan sebagai fallback kompatibilitas.

## 3.3 Tenant Resolver (Hybrid)

Urutan resolver tenant:
1. explicit slug di path (`/{slug}` atau `/api/public/tenants/{slug}/...`)
2. query fallback (`?tenant={slug}`)
3. header fallback (`X-Tenant-Slug`)
4. host fallback (untuk fase subdomain): `{slug}.yourapp.com`

Semua endpoint tenant-aware wajib lewat resolver ini.

## 4) RBAC Tenant + Global

## 4.1 Prinsip

1. Permission tenant hanya berlaku di tenant aktif.
2. Permission global berlaku lintas tenant.
3. Evaluasi akses tetap di middleware + guard UI berbasis permission.

## 4.2 Permission Global Minimum

1. `tenants:list`
2. `tenants:create`
3. `tenants:update`
4. `tenants:delete`
5. `tenants:access_all`
6. `tenants:impersonate` (opsional support/debug)

## 4.3 Middleware Scope

1. `TenantScopeMiddleware`
   - resolve tenant dari path/query/header/host
   - set `tenant_id` ke request context
2. `PermissionMiddleware`
   - user dengan `tenants:access_all` boleh lintas tenant
   - selain itu wajib membership tenant aktif

## 5) Perubahan Data Model

Tambah tabel:
1. `tenants`
   - `id (uuid pk)`
   - `slug (unique)`
   - `name`
   - `status` (`active`, `suspended`)
   - timestamps
2. `tenant_members`
   - `tenant_id`
   - `user_id`
   - `member_type` (`owner`, `member`)
   - unique (`tenant_id`, `user_id`)
3. `tenant_domains` (opsional fase subdomain/custom domain)
   - `tenant_id`
   - `domain`
   - `is_primary`
   - `verified_at`

Perluasan tabel existing:
1. `anniversary_site_configs` tambah `tenant_id`, `edition_year` (atau `config_version`)
2. unique index: (`tenant_id`, `edition_year`)
3. tabel konten lain yang masih global juga harus tenant-aware

## 6) Storage dan Media

Gunakan prefix object storage per tenant:

`tenant/{tenant_id}/anniversary/{year}/...`

Manfaat:
1. isolasi data jelas
2. backup/restore per tenant mudah
3. cleanup tenant aman

## 7) Perubahan API

## 7.1 Public API

Endpoint utama:
1. `GET /api/public/tenants/{slug}/anniversary?lang=id|en`
2. `GET /api/public/tenants/{slug}/moments?lang=id|en`

Fallback kompatibilitas:
1. `GET /api/public/anniversary?tenant={slug}&lang=id|en`
2. header `X-Tenant-Slug`

## 7.2 Setup/Admin API

1. setup tidak lagi single global config
2. semua write operation wajib tenant context
3. endpoint tenant management:
   - `GET /api/tenants`
   - `POST /api/tenants`
   - `GET /api/tenants/:id`
   - `PATCH /api/tenants/:id`
   - `POST /api/tenants/:id/members`

## 8) Perubahan Frontend

1. route publik tenant:
   - `/:slug`
   - `/:slug/game`
   - `/:slug/showcase`
2. service public mengirim slug dari route
3. auth context simpan `activeTenant` untuk area setup/admin
4. untuk `platform_admin`, tampilkan tenant switcher
5. halaman setup menampilkan badge tenant aktif agar tidak salah edit

## 9) Rencana Migrasi dari Single Tenant

## Phase 0 - Preparation

1. feature flag:
   - `MULTI_TENANT_ENABLED=true|false`
2. startup log harus menampilkan mode tenant aktif/nonaktif

## Phase 1 - Schema Foundation

1. buat tabel `tenants`, `tenant_members`
2. alter tabel config jadi tenant-aware
3. buat tenant default dari data existing
4. migrasikan config lama ke tenant default

## Phase 2 - Tenant-Aware Read/Write (Path)

1. repository/service query wajib by `tenant_id`
2. aktifkan `TenantScopeMiddleware`
3. public API by slug path

## Phase 3 - Global Access Role

1. seed permission global tenant management
2. tambah menu management tenant
3. tenant switcher untuk user global

## Phase 4 - Optional Subdomain Rollout

1. setup wildcard DNS Cloudflare (`*`)
2. validasi reverse proxy host-based routing
3. aktifkan host resolver sebagai prioritas
4. UAT minimal 3 tenant

## 10) Acceptance Criteria

1. dua pasangan berbeda tidak bisa saling melihat data
2. URL `/{slugA}` dan `/{slugB}` menampilkan konten berbeda
3. user tenant biasa hanya bisa edit tenant sendiri
4. user dengan `tenants:access_all` bisa pindah tenant dan kelola semua tenant
5. semua upload media tersimpan dengan prefix tenant
6. tidak ada endpoint write yang berjalan tanpa tenant context

## 11) Risiko dan Mitigasi

1. Risiko: query lupa filter `tenant_id`
   - Mitigasi: helper repository tenant-scoped + integration test lintas tenant
2. Risiko: slug tidak tervalidasi
   - Mitigasi: regex slug ketat (`[a-z0-9-]`) + unique index + sanitasi input
3. Risiko: migrasi data lama gagal
   - Mitigasi: dry-run staging + backup sebelum cutover

## 12) Task List Eksekusi

1. migration tabel tenant + alter config tenant_id
2. refactor repository anniversary jadi tenant-aware
3. tambah `TenantScopeMiddleware`
4. tambah seed permission global tenant management
5. tambah API CRUD tenant + member
6. tambah tenant switcher frontend (khusus global permission)
7. update public/setup frontend agar selalu kirim tenant slug
8. tambah test isolasi lintas tenant (public + setup)
9. uji end-to-end path slug di staging
10. siapkan checklist opsional untuk fase subdomain

## 13) Out of Scope (Tahap Ini)

1. custom domain per pasangan
2. billing/subscription
3. marketplace tema/template

Catatan:
1. setelah fase path stabil, subdomain wildcard bisa diaktifkan tanpa mengubah model data
2. setelah subdomain stabil, custom domain bisa ditambah via `tenant_domains`
