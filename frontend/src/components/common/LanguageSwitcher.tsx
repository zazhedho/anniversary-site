import { useLanguage } from "../../contexts/LocaleContext";

type LanguageSwitcherProps = {
  className?: string;
};

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-full border border-[#9c4f46]/25 bg-white/70 p-1 text-xs ${className}`.trim()}>
      <button
        type="button"
        onClick={() => setLanguage("id")}
        className={`rounded-full px-2.5 py-1 font-semibold ${language === "id" ? "bg-[#9c4f46] text-white" : "text-[#6f332f]"}`}
      >
        {t("language.id")}
      </button>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-full px-2.5 py-1 font-semibold ${language === "en" ? "bg-[#9c4f46] text-white" : "text-[#6f332f]"}`}
      >
        {t("language.en")}
      </button>
    </div>
  );
}
