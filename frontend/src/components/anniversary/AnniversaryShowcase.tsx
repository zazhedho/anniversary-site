import { useEffect, useMemo, useState } from "react";
import ScrollReveal from "../common/ScrollReveal";
import MemoryMapSection from "./MemoryMapSection";
import { useLanguage } from "../../contexts/LocaleContext";
import { fetchPublicAnniversary } from "../../services/publicService";
import type { PublicMemoryCard, PublicPayload } from "../../types/anniversary";
import { getOrCreateJourneyAudio, pauseJourneyMusic, playJourneyMusic, subscribeJourneyAudioState } from "../../utils/publicJourneyAudio";

type CountdownState = { days: number; hours: number; minutes: number; seconds: number };
type MusicSource =
  | { kind: "none" }
  | { kind: "audio"; url: string }
  | { kind: "youtube"; url: string; embedUrl: string };

function parseDate(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toCountdown(target: Date): CountdownState {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / (60 * 60 * 24)),
    hours: Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60)),
    minutes: Math.floor((totalSeconds % (60 * 60)) / 60),
    seconds: totalSeconds % 60,
  };
}

function toElapsed(start: Date): CountdownState {
  const diff = Math.max(0, Date.now() - start.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / (60 * 60 * 24)),
    hours: Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60)),
    minutes: Math.floor((totalSeconds % (60 * 60)) / 60),
    seconds: totalSeconds % 60,
  };
}

function statusLabel(status: "done" | "today" | "upcoming", t: (key: string) => string): string {
  if (status === "done") return t("showcase.status.done");
  if (status === "today") return t("showcase.status.today");
  return t("showcase.status.upcoming");
}

function extractYoutubeVideoId(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function resolveMusicSource(value?: string): MusicSource {
  const url = (value || "").trim();
  if (!url) return { kind: "none" };

  const youtubeId = extractYoutubeVideoId(url);
  if (youtubeId) {
    return {
      kind: "youtube",
      url,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`,
    };
  }

  return { kind: "audio", url };
}

export default function AnniversaryShowcase() {
  const { language, t } = useLanguage();
  const [payload, setPayload] = useState<PublicPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNote, setSelectedNote] = useState("");
  const [countdown, setCountdown] = useState<CountdownState>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [elapsed, setElapsed] = useState<CountdownState>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(language === "id" ? "id-ID" : "en-US", { day: "numeric", month: "long", year: "numeric" }),
    [language]
  );

  function formatDate(value: string): string {
    const parsed = parseDate(value);
    return parsed ? dateFormatter.format(parsed) : "-";
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchPublicAnniversary(language);
        if (!mounted) return;
        setPayload(data);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : t("showcase.loadError"));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [language, t]);

  useEffect(() => {
    if (!payload) return;

    const target = parseDate(payload.next_anniversary.date);
    const weddingDate = parseDate(payload.config.wedding_date);

    const update = () => {
      if (weddingDate) {
        setElapsed(toElapsed(weddingDate));
      }
      if (payload.next_anniversary.is_today || !target) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown(toCountdown(target));
    };
    update();

    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [payload]);

  const tagText = useMemo(() => {
    if (!payload) return t("showcase.loading");

    return t("showcase.weddingTag", {
      weddingDate: formatDate(payload.config.wedding_date),
      nextLabel: payload.next_anniversary.label,
      nextDate: formatDate(payload.next_anniversary.date),
    });
  }, [payload, t]);
  const musicSource = useMemo(() => resolveMusicSource(payload?.config.music_url), [payload?.config.music_url]);
  const musicDisabled = musicSource.kind === "none";

  async function toggleMusic() {
    if (musicSource.kind !== "audio" || musicDisabled) return;

    try {
      if (isPlaying) {
        pauseJourneyMusic();
        return;
      }

      await playJourneyMusic(musicSource.url);
    } catch {
      setIsPlaying(false);
    }
  }

  useEffect(() => {
    if (musicSource.kind !== "audio") {
      pauseJourneyMusic();
      setIsPlaying(false);
      return;
    }

    const audio = getOrCreateJourneyAudio(musicSource.url);
    if (!audio) {
      setIsPlaying(false);
      return;
    }

    const unsubscribe = subscribeJourneyAudioState((playing) => setIsPlaying(playing));
    if (sessionStorage.getItem("anniversaryJourneyStarted") === "1") {
      void playJourneyMusic(musicSource.url);
    }

    return () => {
      unsubscribe();
    };
  }, [musicSource.kind, musicSource.kind === "audio" ? musicSource.url : ""]);

  if (loading) {
    return <p className="rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm">{t("showcase.loading")}</p>;
  }

  if (error || !payload) {
    return <p className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error || t("showcase.payloadUnavailable")}</p>;
  }

  const { config, moments, next_anniversary: next } = payload;
  const coupleNames = config.couple_names
    .split("&")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[#9c4f46]/20 bg-gradient-to-br from-[#fff8f1] via-[#ffe8d9] to-[#f4d0c4] p-5 sm:p-8">
      <div className="pointer-events-none absolute -right-14 top-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.85),rgba(156,79,70,0.2))] blur-sm" />

      <header>
        <ScrollReveal y={18}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs uppercase tracking-[0.14em] text-[#2b2220]/70">{config.brand}</p>
            {musicSource.kind === "youtube" ? (
              <a
                href={musicSource.url}
                target="_blank"
                rel="noreferrer"
                className="w-fit rounded-full border border-black/15 bg-white/70 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
              >
                {t("showcase.openYoutube")}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-fit rounded-full border border-black/15 bg-white/70 px-4 py-2 text-sm font-semibold opacity-60"
              >
                {t("showcase.musicNotSet")}
              </button>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delayMs={70}>
          <p className="mt-4 mx-auto w-fit rounded-full border border-[#9c4f46]/30 bg-white/60 px-3 py-1 text-xs text-[#6f332f]">{tagText}</p>
        </ScrollReveal>
        <ScrollReveal delayMs={140}>
          <h2 className="mt-3 text-center font-display text-4xl leading-[0.95] sm:text-6xl">{config.hero_title}</h2>
        </ScrollReveal>
        <ScrollReveal delayMs={200}>
          <div className="mt-6 flex flex-col items-center text-center sm:mt-7">
            <div className="mb-2 flex items-center gap-3 text-[#9c4f46]/55">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#9c4f46]/60 sm:w-14" />
              <span className="h-2 w-2 rounded-full bg-[#9c4f46]/50" />
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#9c4f46]/60 sm:w-14" />
            </div>
            {coupleNames.length > 1 ? (
              <>
                <p className="font-display text-3xl leading-tight sm:text-4xl">
                  <span className="bg-gradient-to-r from-[#8f3c36] via-[#b75c52] to-[#7a2d28] bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
                    {coupleNames[0]}
                  </span>
                </p>
                <span className="my-0.5 text-sm font-semibold text-[#8f3c36]/80">&</span>
                <p className="font-display text-3xl leading-tight sm:text-4xl">
                  <span className="bg-gradient-to-r from-[#7a2d28] via-[#b75c52] to-[#8f3c36] bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
                    {coupleNames.slice(1).join(" & ")}
                  </span>
                </p>
              </>
            ) : (
              <p className="font-display text-3xl leading-tight text-[#6f332f] sm:text-4xl">{config.couple_names}</p>
            )}
          </div>
        </ScrollReveal>
        <ScrollReveal delayMs={250}>
          <p className="mx-auto mt-3 max-w-3xl text-center text-sm text-[#2b2220]/75">{config.hero_subtext}</p>
        </ScrollReveal>

        {musicSource.kind === "youtube" ? (
          <ScrollReveal delayMs={280}>
            <div className="mx-auto mt-5 max-w-2xl overflow-hidden rounded-2xl border border-[#9c4f46]/20 bg-black/5 p-2">
              <div className="aspect-video w-full overflow-hidden rounded-xl">
                <iframe
                  src={musicSource.embedUrl}
                  title="YouTube Music"
                  className="h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </ScrollReveal>
        ) : null}

        <ScrollReveal delayMs={320}>
          <div className="mt-6 flex justify-center">
            <div className="grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [t("showcase.countdown.days"), countdown.days],
                [t("showcase.countdown.hours"), countdown.hours],
                [t("showcase.countdown.minutes"), countdown.minutes],
                [t("showcase.countdown.seconds"), countdown.seconds],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-3 text-center">
                  <p className="font-display text-3xl text-[#6f332f]">{String(value).padStart(2, "0")}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#2b2220]/65">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal delayMs={360}>
          <p className="mt-3 text-center text-sm text-[#2b2220]/70">
            {next.is_today ? t("showcase.todayMessage", { label: next.label }) : t("showcase.countdownMessage", { label: next.label })}
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={400}>
          <p className="mt-5 text-center text-sm text-[#2b2220]/75">{t("showcase.togetherSince", { date: formatDate(config.wedding_date) })}</p>
        </ScrollReveal>
        <ScrollReveal delayMs={450}>
          <div className="mt-3 flex justify-center">
            <div className="grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                [t("showcase.countdown.days"), elapsed.days],
                [t("showcase.countdown.hours"), elapsed.hours],
                [t("showcase.countdown.minutes"), elapsed.minutes],
                [t("showcase.countdown.seconds"), elapsed.seconds],
              ].map(([label, value]) => (
                <div key={`elapsed-${String(label)}`} className="rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-3 text-center">
                  <p className="font-display text-3xl text-[#6f332f]">{String(value).padStart(2, "0")}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#2b2220]/65">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </header>

      <ScrollReveal className="mt-7">
        <section>
          <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.journey")}</h3>
          <div className="mt-3 grid gap-3 border-l-2 border-dashed border-[#9c4f46]/30 pl-4 sm:pl-6">
            {config.timeline.map((item, index) => (
              <ScrollReveal key={`${item.title}-${index}`} delayMs={index * 70} y={16}>
                <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/55 p-4">
                  <p className="font-display text-3xl">{item.title}</p>
                  <p className="mt-1 text-sm text-[#2b2220]/75">{item.description}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal className="mt-7">
        <MemoryMapSection t={t} points={config.map_points || []} />
      </ScrollReveal>

      <ScrollReveal className="mt-7">
        <section>
          <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.moments")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {moments.map((moment, index) => (
              <ScrollReveal key={`${moment.year}-${moment.date}`} delayMs={index * 80} y={16}>
                <article className="rounded-2xl border border-[#9c4f46]/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.72),rgba(244,208,196,0.45))] p-4">
                  <p className="inline-flex rounded-full border border-[#9c4f46]/25 bg-white/65 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-[#6f332f]">
                    {t("showcase.badge", { year: moment.year, status: statusLabel(moment.status, t) })}
                  </p>
                  <p className="mt-2 font-display text-3xl">{moment.title}</p>
                  <p className="text-sm font-semibold">{formatDate(moment.date)}</p>
                  <p className="mt-2 text-sm text-[#2b2220]/75">{moment.note}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal className="mt-7">
        <section>
          <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.memories")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {config.memory_cards.map((card: PublicMemoryCard, index: number) => (
              <ScrollReveal key={`${card.title}-${index}`} delayMs={index * 80} y={16}>
                <button
                  type="button"
                  onClick={() => setSelectedNote(card.note)}
                  className="w-full rounded-2xl border border-[#9c4f46]/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.72),rgba(244,208,196,0.45))] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <p className="font-display text-3xl">{card.title}</p>
                  <p className="text-sm text-[#2b2220]/75">{card.summary}</p>
                </button>
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delayMs={120} y={14}>
            <p className="mt-3 rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm text-[#6f332f]">{selectedNote || t("showcase.defaultNote")}</p>
          </ScrollReveal>
        </section>
      </ScrollReveal>

      <ScrollReveal className="mt-7">
        <section>
          <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.letter")}</h3>
          <p className="mt-3 rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm leading-relaxed text-[#2b2220]/75">{config.letter}</p>
        </section>
      </ScrollReveal>

      <ScrollReveal delayMs={100}>
        <p className="mt-6 border-t border-black/10 pt-4 text-sm text-[#2b2220]/70">{config.footer_text}</p>
      </ScrollReveal>

      {musicSource.kind === "audio" && !musicDisabled ? (
        <button
          type="button"
          aria-label={isPlaying ? t("showcase.pauseSong") : t("showcase.playSong")}
          onClick={toggleMusic}
          className="fixed bottom-5 right-5 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#9c4f46]/25 bg-[#9c4f46] text-white shadow-[0_14px_28px_rgba(111,51,47,0.38)] transition hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
        >
          {isPlaying ? (
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
    </div>
  );
}
