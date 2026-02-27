import type { ReactNode } from "react";
import { useLanguage } from "../../contexts/LocaleContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md rounded-3xl border border-[#9c4f46]/25 bg-white/80 p-6 shadow-[0_18px_60px_rgba(112,51,47,0.16)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#9c4f46]">{t("auth.card.tag")}</p>
        <LanguageSwitcher />
      </div>
      <h1 className="mt-2 font-display text-5xl leading-none text-[#2b2220]">{title}</h1>
      <p className="mt-2 text-sm text-[#2b2220]/70">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
