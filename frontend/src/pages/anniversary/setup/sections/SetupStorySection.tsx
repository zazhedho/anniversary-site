import type { EditLanguage, RootLocalizedKey, SetupForm, TranslateFn } from "../types";
import { setupFieldLimits } from "../fieldLimits";
import FieldCounter from "../FieldCounter";

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
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="block text-sm font-semibold">{t("setup.coverBadge")}</span>
            <FieldCounter value={form.cover_badge[editLanguage]} max={setupFieldLimits.coverBadge} />
          </div>
          <input
            type="text"
            value={form.cover_badge[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("cover_badge", event.target.value)}
            maxLength={setupFieldLimits.coverBadge}
            placeholder={t("setup.placeholder.coverBadge")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="block text-sm font-semibold">{t("setup.coverCta")}</span>
            <FieldCounter value={form.cover_cta[editLanguage]} max={setupFieldLimits.coverCTA} />
          </div>
          <input
            type="text"
            value={form.cover_cta[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("cover_cta", event.target.value)}
            maxLength={setupFieldLimits.coverCTA}
            placeholder={t("setup.placeholder.coverCta")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="block text-sm font-semibold">{t("setup.coverTitle")}</span>
            <FieldCounter value={form.cover_title[editLanguage]} max={setupFieldLimits.coverTitle} />
          </div>
          <input
            type="text"
            value={form.cover_title[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("cover_title", event.target.value)}
            maxLength={setupFieldLimits.coverTitle}
            placeholder={t("setup.placeholder.coverTitle")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="block text-sm font-semibold">{t("setup.heroTitle")}</span>
            <FieldCounter value={form.hero_title[editLanguage]} max={setupFieldLimits.heroTitle} />
          </div>
          <input
            type="text"
            value={form.hero_title[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("hero_title", event.target.value)}
            maxLength={setupFieldLimits.heroTitle}
            placeholder={t("setup.placeholder.heroTitle")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="block text-sm font-semibold">{t("setup.footerText")}</span>
            <FieldCounter value={form.footer_text[editLanguage]} max={setupFieldLimits.footerText} />
          </div>
          <input
            type="text"
            value={form.footer_text[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("footer_text", event.target.value)}
            maxLength={setupFieldLimits.footerText}
            placeholder={t("setup.placeholder.footerText")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>
      </div>

      <label className="block">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="block text-sm font-semibold">{t("setup.coverSubtext")}</span>
          <FieldCounter value={form.cover_subtext[editLanguage]} max={setupFieldLimits.coverSubtext} />
        </div>
        <textarea
          value={form.cover_subtext[editLanguage]}
          onChange={(event) => onLocalizedFieldChange("cover_subtext", event.target.value)}
          maxLength={setupFieldLimits.coverSubtext}
          placeholder={t("setup.placeholder.coverSubtext")}
          className="min-h-[88px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
          required
        />
      </label>

      <label className="block">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="block text-sm font-semibold">{t("setup.heroSubtext")}</span>
          <FieldCounter value={form.hero_subtext[editLanguage]} max={setupFieldLimits.heroSubtext} />
        </div>
        <textarea
          value={form.hero_subtext[editLanguage]}
          onChange={(event) => onLocalizedFieldChange("hero_subtext", event.target.value)}
          maxLength={setupFieldLimits.heroSubtext}
          placeholder={t("setup.placeholder.heroSubtext")}
          className="min-h-[88px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
          required
        />
      </label>

      <label className="block">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="block text-sm font-semibold">{t("setup.letter")}</span>
          <FieldCounter value={form.letter[editLanguage]} max={setupFieldLimits.letter} />
        </div>
        <textarea
          value={form.letter[editLanguage]}
          onChange={(event) => onLocalizedFieldChange("letter", event.target.value)}
          maxLength={setupFieldLimits.letter}
          placeholder={t("setup.placeholder.letter")}
          className="min-h-[120px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
          required
        />
      </label>
    </article>
  );
}
