import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";
import ScrollReveal from "../../components/common/ScrollReveal";
import SiteFooter from "../../components/common/SiteFooter";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { fetchPublicAnniversary } from "../../services/publicService";
import type { PublicSiteConfig } from "../../types/anniversary";
import { buildPublicTenantPath, resolveTenantSlug } from "../../utils/tenantSlug";
import { startJourneyMusicFromGesture } from "../../utils/publicJourneyAudio";

export default function PublicAnniversaryPage() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const tenantSlug = resolveTenantSlug(slug);
  const { isAuthenticated, loading, hasAccess } = useAuth();
  const { language, t } = useLanguage();
  const [config, setConfig] = useState<PublicSiteConfig | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const payload = await fetchPublicAnniversary(language, tenantSlug);
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
  }, [language, tenantSlug]);

  const coverBadge = useMemo(() => config?.cover_badge || config?.brand || "My another Z • I'm YourZ", [config]);
  const coverTitle = useMemo(() => config?.cover_title || config?.hero_title || t("public.coverTitle"), [config, t]);
  const coverSubtext = useMemo(() => config?.cover_subtext || config?.hero_subtext || t("public.coverSubtitle"), [config, t]);
  const coverCTA = useMemo(() => config?.cover_cta || t("public.startJourney"), [config, t]);
  const canViewDashboard = hasAccess({ resource: "dashboard", action: "view" });
  const canViewProfile = hasAccess({ resource: "profile", action: "view" });
  const homePath = buildPublicTenantPath(tenantSlug, "home");
  const gamePath = buildPublicTenantPath(tenantSlug, "game");
  const authDestination = canViewDashboard ? "/app/dashboard" : canViewProfile ? "/app/profile" : homePath;
  const authLabel = canViewDashboard ? t("public.dashboard") : t("nav.profile");

  async function handleStartJourney() {
    sessionStorage.setItem("anniversaryJourneyStarted", "1");
    await startJourneyMusicFromGesture(config?.music_url);
    navigate(gamePath);
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-6 text-[#2b2220]">
      <div className="mx-auto w-full max-w-[960px] flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">{t("public.tag")}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <LanguageSwitcher className="align-middle" />
            {!loading ? (
              isAuthenticated ? (
                <Link to={authDestination} className="rounded-full bg-[#9c4f46] px-3 py-1.5 font-semibold text-white">{authLabel}</Link>
              ) : (
                <Link to="/app/login" className="rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 font-semibold">{t("public.login")}</Link>
              )
            ) : null}
          </div>
        </div>

        <ScrollReveal>
          <section className="relative overflow-hidden rounded-[30px] border border-[#9c4f46]/20 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.92),rgba(244,208,196,0.58))] p-6 text-center sm:p-10">
            <div className="pointer-events-none absolute -left-12 top-8 h-36 w-36 rounded-full bg-white/45 blur-2xl" />
            <div className="pointer-events-none absolute -right-10 bottom-8 h-40 w-40 rounded-full bg-[#f0b9a4]/45 blur-2xl" />

            <div className="relative mx-auto max-w-2xl">
              <ScrollReveal delayMs={80} y={16}>
                <p className="text-xs uppercase tracking-[0.18em] text-[#6f332f]/75">{coverBadge}</p>
              </ScrollReveal>
              <ScrollReveal delayMs={170} y={20}>
                <h1 className="mt-3 font-display text-5xl leading-[0.94] sm:text-6xl">{coverTitle}</h1>
              </ScrollReveal>
              <ScrollReveal delayMs={260} y={22}>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#2b2220]/78 sm:text-base">{coverSubtext}</p>
              </ScrollReveal>

              <ScrollReveal delayMs={340} y={24}>
                <div className="mt-7">
                  <button
                    type="button"
                    onClick={handleStartJourney}
                    className="inline-flex items-center justify-center rounded-full bg-[#9c4f46] px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(111,51,47,0.35)] transition hover:-translate-y-0.5"
                  >
                    {coverCTA}
                  </button>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </ScrollReveal>
      </div>
      <div className="mx-auto w-full max-w-[960px]">
        <SiteFooter className="mt-6" />
      </div>
    </main>
  );
}
