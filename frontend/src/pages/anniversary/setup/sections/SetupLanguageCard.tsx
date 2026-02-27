import type { EditLanguage, TranslateFn } from "../types";

type SetupLanguageCardProps = {
  t: TranslateFn;
  editLanguage: EditLanguage;
  onChangeLanguage: (language: EditLanguage) => void;
};

export default function SetupLanguageCard({ t, editLanguage, onChangeLanguage }: SetupLanguageCardProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <p className="text-sm font-semibold">{t("setup.editLanguage")}</p>
      <p className="mb-2 text-xs text-[#2b2220]/70">{t("setup.editLanguageHint")}</p>
      <div className="inline-flex rounded-full border border-[#9c4f46]/25 bg-white p-1">
        <button
          type="button"
          onClick={() => onChangeLanguage("id")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${editLanguage === "id" ? "bg-[#9c4f46] text-white" : "text-[#6f332f]"}`}
        >
          {t("language.id")}
        </button>
        <button
          type="button"
          onClick={() => onChangeLanguage("en")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${editLanguage === "en" ? "bg-[#9c4f46] text-white" : "text-[#6f332f]"}`}
        >
          {t("language.en")}
        </button>
      </div>
    </article>
  );
}
