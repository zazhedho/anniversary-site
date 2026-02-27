import type { EditLanguage, RootLocalizedKey, SetupForm, TranslateFn } from "../types";

type SetupStorySectionProps = {
  t: TranslateFn;
  form: SetupForm;
  editLanguage: EditLanguage;
  onLocalizedFieldChange: (key: RootLocalizedKey, value: string) => void;
};

export default function SetupStorySection({ t, form, editLanguage, onLocalizedFieldChange }: SetupStorySectionProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 space-y-3">
      <p className="text-sm font-semibold">{t("setup.sectionStory")}</p>
      <p className="text-xs text-[#2b2220]/70">{t("setup.sectionStoryHint")}</p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.heroTitle")}</span>
          <input
            type="text"
            value={form.hero_title[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("hero_title", event.target.value)}
            placeholder={t("setup.placeholder.heroTitle")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.footerText")}</span>
          <input
            type="text"
            value={form.footer_text[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("footer_text", event.target.value)}
            placeholder={t("setup.placeholder.footerText")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t("setup.heroSubtext")}</span>
        <textarea
          value={form.hero_subtext[editLanguage]}
          onChange={(event) => onLocalizedFieldChange("hero_subtext", event.target.value)}
          placeholder={t("setup.placeholder.heroSubtext")}
          className="min-h-[88px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t("setup.letter")}</span>
        <textarea
          value={form.letter[editLanguage]}
          onChange={(event) => onLocalizedFieldChange("letter", event.target.value)}
          placeholder={t("setup.placeholder.letter")}
          className="min-h-[120px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
          required
        />
      </label>
    </article>
  );
}
