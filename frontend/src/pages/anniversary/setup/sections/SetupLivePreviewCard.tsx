import { useEffect, useMemo, useRef, useState } from "react";
import type { AnnualMomentView, NextAnniversary, PublicPayload, PublicSiteConfig } from "../../../../types/anniversary";
import { buildPublicTenantPath, normalizeTenantSlug } from "../../../../utils/tenantSlug";
import { writeSetupPreviewPayload } from "../previewStorage";
import type { EditLanguage, LocalizedForm, SetupForm, TranslateFn } from "../types";

type SetupLivePreviewCardProps = {
  t: TranslateFn;
  form: SetupForm;
  tenantSlug: string;
  previewLanguage: EditLanguage;
  onChangePreviewLanguage: (language: EditLanguage) => void;
  onRefreshPreview: () => void;
  hasPendingChanges: boolean;
};

const PHONE_BODY_WIDTH = 430;
const PHONE_BODY_HEIGHT = 902;
const DESKTOP_VIEWPORT_WIDTH = 1366;
const DESKTOP_VIEWPORT_HEIGHT = 860;

function pickLocalizedText(value: LocalizedForm, language: EditLanguage): string {
  const current = (value?.[language] || "").trim();
  if (current) return current;

  const fallback = language === "id" ? value?.en : value?.id;
  return (fallback || "").trim();
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseCoordinate(value: string): number {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Number(parsed.toFixed(7));
}

function toPublicConfig(form: SetupForm, language: EditLanguage): PublicSiteConfig {
  return {
    brand: pickLocalizedText(form.brand, language),
    couple_names: pickLocalizedText(form.couple_names, language),
    wedding_date: form.wedding_date,
    cover_badge: pickLocalizedText(form.cover_badge, language),
    cover_title: pickLocalizedText(form.cover_title, language),
    cover_subtext: pickLocalizedText(form.cover_subtext, language),
    cover_cta: pickLocalizedText(form.cover_cta, language),
    hero_title: pickLocalizedText(form.hero_title, language),
    hero_subtext: pickLocalizedText(form.hero_subtext, language),
    letter: pickLocalizedText(form.letter, language),
    footer_text: pickLocalizedText(form.footer_text, language),
    music_url: form.music_url.trim(),
    voice_note_url: form.voice_note_url.trim(),
    timeline: form.timeline.map((item) => ({
      title: pickLocalizedText(item.title, language),
      description: pickLocalizedText(item.description, language),
    })),
    memory_cards: form.memory_cards.map((item) => ({
      title: pickLocalizedText(item.title, language),
      summary: pickLocalizedText(item.summary, language),
      note: pickLocalizedText(item.note, language),
    })),
    map_points: form.map_points.map((item) => ({
      title: pickLocalizedText(item.title, language),
      note: pickLocalizedText(item.note, language),
      lat: parseCoordinate(item.lat),
      lng: parseCoordinate(item.lng),
    })),
    gallery_photos: form.gallery_photos
      .filter((item) => item.image_url.trim() !== "")
      .map((item) => ({
        id: item.id || undefined,
        title: pickLocalizedText(item.title, language),
        caption: pickLocalizedText(item.caption, language),
        image_url: item.image_url.trim(),
      })),
    gallery_videos: form.gallery_videos
      .filter((item) => item.video_url.trim() !== "")
      .map((item) => ({
        id: item.id || undefined,
        title: pickLocalizedText(item.title, language),
        description: pickLocalizedText(item.description, language),
        video_url: item.video_url.trim(),
        poster_url: item.poster_url.trim() || undefined,
      })),
    annual_moments: form.annual_moments
      .map((item) => ({
        year: Number(item.year) || 1,
        title: pickLocalizedText(item.title, language),
        date: item.date,
        note: pickLocalizedText(item.note, language),
      }))
      .sort((a, b) => a.year - b.year),
  };
}

function getMomentStatus(date: string): "done" | "today" | "upcoming" {
  const target = parseDate(date);
  if (!target) return "upcoming";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  if (targetDate.getTime() === today.getTime()) return "today";
  return targetDate.getTime() < today.getTime() ? "done" : "upcoming";
}

function resolveNextAnniversary(config: PublicSiteConfig, language: EditLanguage): NextAnniversary {
  const firstMoment = config.annual_moments[0];
  const fallbackDate = config.wedding_date || "";
  const fallbackNumber = Math.max(1, firstMoment?.year || 1);
  const fallbackLabel = firstMoment?.title || (language === "id" ? `Anniversary ke-${fallbackNumber}` : `${fallbackNumber}th Anniversary`);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const mapped = config.annual_moments
    .map((item) => ({
      ...item,
      parsedDate: parseDate(item.date),
    }))
    .filter((item) => item.parsedDate);

  const upcoming = mapped.find((item) => {
    if (!item.parsedDate) return false;
    const itemDate = new Date(item.parsedDate.getFullYear(), item.parsedDate.getMonth(), item.parsedDate.getDate());
    return itemDate.getTime() >= todayStart.getTime();
  });

  const target = upcoming || mapped[mapped.length - 1];
  if (!target || !target.parsedDate) {
    const targetTime = fallbackDate ? `${fallbackDate}T00:00:00+07:00` : new Date().toISOString();
    return {
      number: fallbackNumber,
      label: fallbackLabel,
      date: fallbackDate,
      target_time: targetTime,
      is_today: false,
    };
  }

  const targetDateStart = new Date(target.parsedDate.getFullYear(), target.parsedDate.getMonth(), target.parsedDate.getDate());
  return {
    number: target.year,
    label: target.title,
    date: target.date,
    target_time: `${target.date}T00:00:00+07:00`,
    is_today: targetDateStart.getTime() === todayStart.getTime(),
  };
}

function toMomentsView(config: PublicSiteConfig): AnnualMomentView[] {
  return config.annual_moments.map((item) => ({
    ...item,
    status: getMomentStatus(item.date),
  }));
}

function toPreviewPayload(form: SetupForm, language: EditLanguage): PublicPayload {
  const config = toPublicConfig(form, language);
  return {
    config,
    next_anniversary: resolveNextAnniversary(config, language),
    moments: toMomentsView(config),
    timezone: "Asia/Jakarta",
    server_time: new Date().toISOString(),
  };
}

export default function SetupLivePreviewCard({
  t,
  form,
  tenantSlug,
  previewLanguage,
  onChangePreviewLanguage,
  onRefreshPreview,
  hasPendingChanges,
}: SetupLivePreviewCardProps) {
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [mobilePreviewVersion, setMobilePreviewVersion] = useState(0);
  const [mobileScale, setMobileScale] = useState(1);
  const [desktopScale, setDesktopScale] = useState(1);
  const mobileHostRef = useRef<HTMLDivElement | null>(null);
  const desktopHostRef = useRef<HTMLDivElement | null>(null);
  const normalizedTenantSlug = normalizeTenantSlug(tenantSlug);
  const canOpenPublicPreview = normalizedTenantSlug !== "";
  const publicPreviewPath = useMemo(
    () => buildPublicTenantPath(canOpenPublicPreview ? normalizedTenantSlug : undefined, "home"),
    [canOpenPublicPreview, normalizedTenantSlug]
  );
  const previewPayload = useMemo(() => toPreviewPayload(form, previewLanguage), [form, previewLanguage]);
  const mobilePreviewPath = useMemo(
    () => `/app/setup/anniversary/preview?v=${mobilePreviewVersion}&s=0.9`,
    [mobilePreviewVersion]
  );
  const desktopPreviewPath = useMemo(() => `/app/setup/anniversary/preview?v=${mobilePreviewVersion}`, [mobilePreviewVersion]);

  useEffect(() => {
    writeSetupPreviewPayload(previewPayload);
    setMobilePreviewVersion((previous) => previous + 1);
  }, [previewPayload]);

  useEffect(() => {
    if (previewViewport !== "mobile") return;
    const host = mobileHostRef.current;
    if (!host) return;

    const syncScale = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width <= 0 || height <= 0) return;
      const nextScale = Math.min(width / PHONE_BODY_WIDTH, height / PHONE_BODY_HEIGHT, 1);
      setMobileScale(nextScale);
    };

    syncScale();
    const observer = new ResizeObserver(syncScale);
    observer.observe(host);
    return () => observer.disconnect();
  }, [previewViewport]);

  useEffect(() => {
    if (previewViewport !== "desktop") return;
    const host = desktopHostRef.current;
    if (!host) return;

    const syncScale = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width <= 0 || height <= 0) return;
      const nextScale = Math.min(width / DESKTOP_VIEWPORT_WIDTH, height / DESKTOP_VIEWPORT_HEIGHT, 1);
      setDesktopScale(nextScale);
    };

    syncScale();
    const observer = new ResizeObserver(syncScale);
    observer.observe(host);
    return () => observer.disconnect();
  }, [previewViewport]);

  return (
    <aside className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 lg:sticky lg:top-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{t("setup.preview.title")}</p>
          <p className="text-xs text-[#2b2220]/70">{t("setup.preview.manualHint")}</p>
        </div>
        <div className="inline-flex rounded-full border border-[#9c4f46]/25 bg-white p-1">
          <button
            type="button"
            onClick={() => onChangePreviewLanguage("id")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              previewLanguage === "id" ? "bg-[#9c4f46] text-white" : "text-[#6f332f]"
            }`}
          >
            {t("language.id")}
          </button>
          <button
            type="button"
            onClick={() => onChangePreviewLanguage("en")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              previewLanguage === "en" ? "bg-[#9c4f46] text-white" : "text-[#6f332f]"
            }`}
          >
            {t("language.en")}
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#9c4f46]/20 bg-white/70 px-3 py-2">
        <p className={`text-xs ${hasPendingChanges ? "text-amber-700" : "text-emerald-700"}`}>
          {hasPendingChanges ? t("setup.preview.statusPending") : t("setup.preview.statusUpToDate")}
        </p>
        <button
          type="button"
          onClick={onRefreshPreview}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${
            hasPendingChanges ? "bg-[#9c4f46]" : "bg-[#7c4f48]"
          }`}
        >
          {t("setup.preview.refresh")}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-[#9c4f46]/20 bg-white/70 px-3 py-2">
        <p className="text-xs text-[#2b2220]/70">{t("setup.preview.viewportLabel")}</p>
        <div className="inline-flex rounded-full border border-[#9c4f46]/25 bg-white p-1">
          <button
            type="button"
            onClick={() => setPreviewViewport("mobile")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              previewViewport === "mobile" ? "bg-[#9c4f46] text-white" : "text-[#6f332f]"
            }`}
          >
            {t("setup.preview.viewportMobile")}
          </button>
          <button
            type="button"
            onClick={() => setPreviewViewport("desktop")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              previewViewport === "desktop" ? "bg-[#9c4f46] text-white" : "text-[#6f332f]"
            }`}
          >
            {t("setup.preview.viewportDesktop")}
          </button>
        </div>
      </div>

      {canOpenPublicPreview ? (
        <a
          href={publicPreviewPath}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[#9c4f46]/35 bg-white px-3 py-2 text-sm font-semibold text-[#6f332f] transition hover:-translate-y-0.5"
        >
          {t("setup.preview.openFull")}
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[#9c4f46]/25 bg-white/70 px-3 py-2 text-sm font-semibold text-[#6f332f]/70"
        >
          {t("setup.preview.openFullDisabled")}
        </button>
      )}

      <div
        className={`relative mt-4 rounded-2xl border border-[#9c4f46]/20 p-2 ${
          previewViewport === "mobile"
            ? "h-[78vh] overflow-hidden bg-[radial-gradient(circle_at_50%_18%,#fff6ef_0%,#f7e1d4_50%,#efcbbb_100%)]"
            : "h-[72vh] overflow-hidden bg-[radial-gradient(circle_at_50%_10%,#fff8f3_0%,#f6dfd2_42%,#edc6b5_100%)]"
        }`}
      >
        <div className="pointer-events-none absolute -top-16 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full bg-white/35 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-32 w-[65%] -translate-x-1/2 rounded-full bg-black/5 blur-xl" />
        {previewViewport === "mobile" ? (
          <div ref={mobileHostRef} className="relative z-10 mx-auto h-full w-full overflow-hidden">
            <div className="flex h-full w-full items-center justify-center">
              <div
                className="relative shrink-0 rounded-[3.2rem] bg-[#121214] p-[10px] shadow-[0_28px_60px_rgba(0,0,0,0.35)]"
                style={{
                  width: `${PHONE_BODY_WIDTH}px`,
                  height: `${PHONE_BODY_HEIGHT}px`,
                  transform: `scale(${mobileScale})`,
                  transformOrigin: "center center",
                }}
              >
                <div className="absolute left-0 top-[20%] h-12 w-[3px] rounded-r bg-[#2b2b2f]" />
                <div className="absolute left-0 top-[34%] h-14 w-[3px] rounded-r bg-[#2b2b2f]" />
                <div className="absolute right-0 top-[26%] h-20 w-[3px] rounded-l bg-[#2b2b2f]" />

                <div
                  className="absolute inset-y-[10px] left-1/2 -translate-x-1/2 overflow-hidden rounded-[2.75rem] border border-black/40 bg-black"
                  style={{ aspectRatio: "1320 / 2868" }}
                >
                  <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-8 w-40 -translate-x-1/2 rounded-full bg-black/95 shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
                  <iframe
                    key={mobilePreviewPath}
                    src={mobilePreviewPath}
                    title="Setup mobile preview"
                    loading="lazy"
                    className="h-full w-full border-0 bg-[#fff3eb]"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div ref={desktopHostRef} className="relative z-10 mx-auto h-full w-full overflow-hidden">
            <div className="flex h-full w-full items-center justify-center">
              <div
                className="shrink-0 overflow-hidden rounded-2xl border border-[#9c4f46]/25 bg-[#f8e9df] shadow-[0_18px_36px_rgba(111,51,47,0.18)]"
                style={{
                  width: `${DESKTOP_VIEWPORT_WIDTH}px`,
                  height: `${DESKTOP_VIEWPORT_HEIGHT}px`,
                  transform: `scale(${desktopScale})`,
                  transformOrigin: "center center",
                }}
              >
                <div className="flex h-10 items-center gap-1.5 border-b border-[#9c4f46]/20 bg-white/75 px-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <iframe
                  key={desktopPreviewPath}
                  src={desktopPreviewPath}
                  title="Setup desktop preview"
                  loading="lazy"
                  className="h-[calc(100%-2.5rem)] w-full border-0 bg-[#fff3eb]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
