import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InteractiveLoveGame from "../../components/anniversary/InteractiveLoveGame";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";
import SiteFooter from "../../components/common/SiteFooter";
import { useLanguage } from "../../contexts/LocaleContext";
import { fetchPublicAnniversary } from "../../services/publicService";
import type { PublicSiteConfig } from "../../types/anniversary";

export default function PublicAnniversaryGamePage() {
  const { language, t } = useLanguage();
  const [config, setConfig] = useState<PublicSiteConfig | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const payload = await fetchPublicAnniversary(language);
        if (!mounted) return;
        setConfig(payload.config);
      } catch {
        if (!mounted) return;
        setConfig(undefined);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [language]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#fff3e9_0%,#ffe2d1_44%,#f2cbbf_100%)] px-5 py-6 text-[#2b2220]">
      <div className="mx-auto w-[min(960px,96vw)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">{t("game.pageTag")}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <LanguageSwitcher className="align-middle" />
            <Link to="/anniversary" className="rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 font-semibold">{t("game.backPublic")}</Link>
            <Link to="/login" className="rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 font-semibold">{t("public.login")}</Link>
          </div>
        </div>

        <section className="rounded-[30px] border border-[#9c4f46]/20 bg-white/55 p-5 sm:p-8">
          <h1 className="font-display text-4xl leading-none sm:text-5xl">{t("game.pageTitle")}</h1>
          <p className="mt-2 text-sm text-[#2b2220]/75">{t("game.pageSubtitle")}</p>

          <div className="mx-auto mt-5 w-full max-w-2xl">
            <InteractiveLoveGame t={t} config={config} />
          </div>
        </section>

        <SiteFooter className="mt-6" />
      </div>
    </main>
  );
}
