DROP INDEX IF EXISTS uq_anniversary_site_configs_tenant_year;
DROP INDEX IF EXISTS idx_anniversary_site_configs_tenant_id;

ALTER TABLE anniversary_site_configs
    DROP CONSTRAINT IF EXISTS fk_anniversary_site_configs_tenant_id;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'anniversary_site_configs'
          AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE anniversary_site_configs
            ALTER COLUMN tenant_id DROP DEFAULT;
    END IF;
END
$$;

ALTER TABLE anniversary_site_configs
    DROP COLUMN IF EXISTS edition_year;

ALTER TABLE anniversary_site_configs
    DROP COLUMN IF EXISTS tenant_id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'anniversary_site_configs_config_key_key'
    ) THEN
        ALTER TABLE anniversary_site_configs
            ADD CONSTRAINT anniversary_site_configs_config_key_key UNIQUE (config_key);
    END IF;
END
$$;

DROP TABLE IF EXISTS tenant_members;
DROP TABLE IF EXISTS tenants;
