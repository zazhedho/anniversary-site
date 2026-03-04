-- Phase 1 (multi-tenant foundation):
-- Add tenant tables and tenant columns while preserving current single-tenant behavior.

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tenants_status CHECK (status IN ('active', 'suspended'))
);

CREATE TABLE IF NOT EXISTS tenant_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_type VARCHAR(20) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tenant_id, user_id),
    CONSTRAINT chk_tenant_members_member_type CHECK (member_type IN ('owner', 'member'))
);

-- Stable default tenant UUID to keep legacy repository inserts working.
INSERT INTO tenants (id, slug, name, status, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'default',
    'Default Tenant',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE
SET
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

ALTER TABLE anniversary_site_configs
    ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE anniversary_site_configs
    ADD COLUMN IF NOT EXISTS edition_year INT NOT NULL DEFAULT 1;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'anniversary_site_configs_config_key_key'
    ) THEN
        ALTER TABLE anniversary_site_configs
            DROP CONSTRAINT anniversary_site_configs_config_key_key;
    END IF;
END
$$;

UPDATE anniversary_site_configs
SET tenant_id = '00000000-0000-0000-0000-000000000001'
WHERE tenant_id IS NULL;

ALTER TABLE anniversary_site_configs
    ALTER COLUMN tenant_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE anniversary_site_configs
    ALTER COLUMN tenant_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_anniversary_site_configs_tenant_id'
    ) THEN
        ALTER TABLE anniversary_site_configs
            ADD CONSTRAINT fk_anniversary_site_configs_tenant_id
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE RESTRICT;
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_anniversary_site_configs_tenant_id
    ON anniversary_site_configs(tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_anniversary_site_configs_tenant_year
    ON anniversary_site_configs(tenant_id, edition_year);
