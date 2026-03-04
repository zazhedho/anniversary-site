import type { TranslateFn } from "../types";
import { setupFieldLimits } from "../fieldLimits";

type TenantOption = {
  slug: string;
  name: string;
};

type SetupAccessCardProps = {
  t: TranslateFn;
  tenantSlug: string;
  tenantOptions: TenantOption[];
  fetching: boolean;
  onTenantSlugChange: (value: string) => void;
  onLoadConfig: () => void;
};

export default function SetupAccessCard({
  t,
  tenantSlug,
  tenantOptions,
  fetching,
  onTenantSlugChange,
  onLoadConfig,
}: SetupAccessCardProps) {
  const selectedTenantName = tenantOptions.find((item) => item.slug === tenantSlug)?.name || "";

  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">{t("setup.sectionAccess")}</h2>
        <p className="text-xs text-[#2b2220]/70">{t("setup.accessHint")}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.tenantSlugLabel")}</span>
          <input
            type="text"
            value={tenantSlug}
            list="setup-tenant-options"
            onChange={(event) => onTenantSlugChange(event.target.value)}
            maxLength={setupFieldLimits.tenantSlug}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            placeholder={t("setup.tenantSlugPlaceholder")}
          />
        </label>
        <button
          type="button"
          onClick={onLoadConfig}
          disabled={fetching}
          className="h-[42px] w-full self-end rounded-xl bg-[#9c4f46] px-4 text-sm font-semibold text-white disabled:opacity-60 md:w-auto"
        >
          {fetching ? t("setup.loading") : t("setup.loadConfig")}
        </button>
        <datalist id="setup-tenant-options">
          {tenantOptions.map((tenant) => (
            <option key={tenant.slug} value={tenant.slug}>
              {tenant.name}
            </option>
          ))}
        </datalist>
        {selectedTenantName ? <p className="text-xs text-[#2b2220]/65 md:col-span-2">{selectedTenantName}</p> : null}
      </div>
    </article>
  );
}
