import PasswordInput from "../../../../components/common/PasswordInput";
import type { TranslateFn } from "../types";

type SetupAccessCardProps = {
  t: TranslateFn;
  setupToken: string;
  tenantSlug: string;
  tenantSlugReadOnly: boolean;
  tokenMissing: boolean;
  fetching: boolean;
  onSetupTokenChange: (value: string) => void;
  onTenantSlugChange: (value: string) => void;
  onSaveToken: () => void;
  onLoadConfig: () => void;
};

export default function SetupAccessCard({
  t,
  setupToken,
  tenantSlug,
  tenantSlugReadOnly,
  tokenMissing,
  fetching,
  onSetupTokenChange,
  onTenantSlugChange,
  onSaveToken,
  onLoadConfig,
}: SetupAccessCardProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">{t("setup.sectionAccess")}</h2>
        <p className="text-xs text-[#2b2220]/70">{t("setup.accessHint")}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.tokenLabel")}</span>
          <PasswordInput
            value={setupToken}
            onChange={(event) => onSetupTokenChange(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            placeholder={t("setup.tokenPlaceholder")}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.tenantSlugLabel")}</span>
          <input
            type="text"
            value={tenantSlug}
            onChange={(event) => onTenantSlugChange(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            placeholder={t("setup.tenantSlugPlaceholder")}
            disabled={tenantSlugReadOnly}
          />
        </label>
        <button
          type="button"
          onClick={onSaveToken}
          disabled={tokenMissing}
          className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {t("setup.saveToken")}
        </button>
        <button
          type="button"
          onClick={onLoadConfig}
          disabled={tokenMissing || fetching}
          className="rounded-xl bg-[#9c4f46] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {fetching ? t("setup.loading") : t("setup.loadConfig")}
        </button>
      </div>
    </article>
  );
}
