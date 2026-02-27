import type { RootLocalizedKey, SetupForm, TranslateFn, EditLanguage } from "../types";

type SetupBasicSectionProps = {
  t: TranslateFn;
  form: SetupForm;
  editLanguage: EditLanguage;
  saving: boolean;
  tokenMissing: boolean;
  onLocalizedFieldChange: (key: RootLocalizedKey, value: string) => void;
  onWeddingDateChange: (value: string) => void;
  onMusicUrlChange: (value: string) => void;
};

export default function SetupBasicSection({
  t,
  form,
  editLanguage,
  saving,
  tokenMissing,
  onLocalizedFieldChange,
  onWeddingDateChange,
  onMusicUrlChange,
}: SetupBasicSectionProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{t("setup.sectionBasic")}</p>
          <p className="text-xs text-[#2b2220]/70">{t("setup.sectionBasicHint")}</p>
        </div>
        <button
          type="submit"
          disabled={tokenMissing || saving}
          className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? t("setup.saving") : t("setup.saveAll")}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.brand")}</span>
          <input
            type="text"
            value={form.brand[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("brand", event.target.value)}
            placeholder={t("setup.placeholder.brand")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.coupleNames")}</span>
          <input
            type="text"
            value={form.couple_names[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("couple_names", event.target.value)}
            placeholder={t("setup.placeholder.coupleNames")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.weddingDate")}</span>
          <input
            type="date"
            value={form.wedding_date}
            onChange={(event) => onWeddingDateChange(event.target.value)}
            placeholder={t("setup.placeholder.weddingDate")}
            title={t("setup.placeholder.weddingDate")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.musicUrl")}</span>
          <input
            type="text"
            value={form.music_url}
            onChange={(event) => onMusicUrlChange(event.target.value)}
            placeholder={t("setup.placeholder.musicUrl")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
          />
        </label>
      </div>
    </article>
  );
}
