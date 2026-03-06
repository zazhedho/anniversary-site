import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import InteractiveLoveGame from "../../components/anniversary/InteractiveLoveGame";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";
import SiteFooter from "../../components/common/SiteFooter";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { fetchPublicAnniversary } from "../../services/publicService";
import type { PublicSiteConfig } from "../../types/anniversary";
import { buildPublicTenantPath, resolveTenantSlug } from "../../utils/tenantSlug";
import { canUseJourneyAudio, pauseJourneyMusic, playJourneyMusic, subscribeJourneyAudioState } from "../../utils/publicJourneyAudio";

export default function PublicAnniversaryGamePage() {
  const { slug } = useParams<{ slug?: string }>();
  const tenantSlug = resolveTenantSlug(slug);
  const { isAuthenticated, loading, hasAccess } = useAuth();
  const { language, t } = useLanguage();
  const [config, setConfig] = useState<PublicSiteConfig | undefined>(undefined);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

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

  useEffect(() => {
    if (!config?.music_url) return;
    if (sessionStorage.getItem("anniversaryJourneyStarted") !== "1") return;
    void playJourneyMusic(config.music_url);
  }, [config?.music_url]);

  const canControlMusic = useMemo(() => canUseJourneyAudio(config?.music_url), [config?.music_url]);

  useEffect(() => {
    if (!canControlMusic) {
      setIsMusicPlaying(false);
      return;
    }

    const unsubscribe = subscribeJourneyAudioState((playing) => {
      setIsMusicPlaying(playing);
    });

    return () => {
      unsubscribe();
    };
  }, [canControlMusic]);

  async function handleToggleMusic() {
    if (!config?.music_url || !canControlMusic) return;

    if (isMusicPlaying) {
      pauseJourneyMusic();
      return;
    }

    await playJourneyMusic(config.music_url);
  }

  const canViewDashboard = hasAccess({ resource: "dashboard", action: "view" });
  const canViewProfile = hasAccess({ resource: "profile", action: "view" });
  const homePath = buildPublicTenantPath(tenantSlug, "home");
  const showcasePath = buildPublicTenantPath(tenantSlug, "showcase");
  const authDestination = canViewDashboard ? "/app/dashboard" : canViewProfile ? "/app/profile" : homePath;
  const authLabel = canViewDashboard ? t("public.dashboard") : t("nav.profile");

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_20%_20%,#fff3e9_0%,#ffe2d1_44%,#f2cbbf_100%)] px-5 py-6 text-[#2b2220]">
      <div className="mx-auto w-full max-w-[960px] flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">{t("game.pageTag")}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <LanguageSwitcher className="align-middle" />
            <Link to={homePath} className="rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 font-semibold">{t("game.backPublic")}</Link>
            {!loading ? (
              isAuthenticated ? (
                <Link to={authDestination} className="rounded-full bg-[#9c4f46] px-3 py-1.5 font-semibold text-white">{authLabel}</Link>
              ) : (
                <Link to="/app/login" className="rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 font-semibold">{t("public.login")}</Link>
              )
            ) : null}
          </div>
        </div>

        <section className="rounded-[30px] border border-[#9c4f46]/20 bg-white/55 p-5 sm:p-8">
          <h1 className="font-display text-4xl leading-none sm:text-5xl">{t("game.pageTitle")}</h1>
          <p className="mt-2 text-sm text-[#2b2220]/75">{t("game.pageSubtitle")}</p>

          <div className="mx-auto mt-5 w-full max-w-2xl">
            <InteractiveLoveGame t={t} config={config} showcasePath={showcasePath} />
          </div>
        </section>
      </div>
      <div className="mx-auto w-full max-w-[960px]">
        <SiteFooter className="mt-6" />
      </div>
      {canControlMusic ? (
        <button
          type="button"
          onClick={handleToggleMusic}
          aria-label={isMusicPlaying ? t("showcase.pauseSong") : t("showcase.playSong")}
          title={isMusicPlaying ? t("showcase.pauseSong") : t("showcase.playSong")}
          className="fixed bottom-5 right-5 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#9c4f46]/25 bg-[#9c4f46] text-white shadow-[0_14px_28px_rgba(111,51,47,0.38)] transition hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
        >
          {isMusicPlaying ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current sm:h-7 sm:w-7">
              <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current sm:h-7 sm:w-7">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      ) : null}
    </main>
  );
}
