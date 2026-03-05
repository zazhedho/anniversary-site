import { useMemo, useState } from "react";
import type { TranslateFn } from "../types";
import { setupFieldLimits } from "../fieldLimits";
import FieldCounter from "../FieldCounter";

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
  const [isOpen, setIsOpen] = useState(false);
  const selectedTenantName = tenantOptions.find((item) => item.slug === tenantSlug)?.name || "";
  const keyword = tenantSlug.trim().toLowerCase();
  const filteredOptions = useMemo(
    () =>
      tenantOptions.filter((item) => {
        if (!keyword) return true;
        return item.slug.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword);
      }),
    [tenantOptions, keyword]
  );

  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">{t("setup.sectionAccess")}</h2>
        <p className="text-xs text-[#2b2220]/70">{t("setup.accessHint")}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="block text-sm font-semibold">{t("setup.tenantSlugLabel")}</span>
            <FieldCounter value={tenantSlug} max={setupFieldLimits.tenantSlug} />
          </div>
          <div className="relative">
            <input
              type="text"
              value={tenantSlug}
              onFocus={() => setIsOpen(true)}
              onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
              onChange={(event) => {
                onTenantSlugChange(event.target.value);
                setIsOpen(true);
              }}
              maxLength={setupFieldLimits.tenantSlug}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              placeholder={t("setup.tenantSlugPlaceholder")}
            />
            {isOpen ? (
              <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[#9c4f46]/20 bg-white p-1 shadow-lg">
                {filteredOptions.length === 0 ? (
                  <p className="px-2 py-2 text-xs text-[#2b2220]/60">No tenant found</p>
                ) : (
                  filteredOptions.map((tenant) => (
                    <button
                      key={tenant.slug}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        onTenantSlugChange(tenant.slug);
                        setIsOpen(false);
                      }}
                      className={`block w-full rounded-lg px-2 py-2 text-left text-sm transition ${
                        tenant.slug === tenantSlug ? "bg-[#fff0e6] text-[#6f332f]" : "hover:bg-[#fff6f0]"
                      }`}
                    >
                      <p className="font-semibold">{tenant.name}</p>
                      <p className="text-xs text-[#2b2220]/60">{tenant.slug}</p>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </label>
        <button
          type="button"
          onClick={onLoadConfig}
          disabled={fetching}
          className="h-[42px] w-full self-end rounded-xl bg-[#9c4f46] px-4 text-sm font-semibold text-white disabled:opacity-60 md:w-auto"
        >
          {fetching ? t("setup.loading") : t("setup.loadConfig")}
        </button>
        {selectedTenantName ? <p className="text-xs text-[#2b2220]/65 md:col-span-2">{selectedTenantName}</p> : null}
      </div>
    </article>
  );
}
