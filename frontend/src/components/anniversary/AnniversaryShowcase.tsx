import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../../contexts/LocaleContext";
import { fetchPublicAnniversary } from "../../services/publicService";
import type { PublicMemoryCard, PublicPayload } from "../../types/anniversary";

type CountdownState = { days: number; hours: number; minutes: number; seconds: number };

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

export default function AnniversaryShowcase() {
  const { language, t } = useLanguage();
  const [payload, setPayload] = useState<PublicPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNote, setSelectedNote] = useState("");
  const [countdown, setCountdown] = useState<CountdownState>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [elapsed, setElapsed] = useState<CountdownState>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const musicDisabled = !payload?.config.music_url;

  async function toggleMusic() {
    if (!audioRef.current || musicDisabled) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }

  if (loading) {
    return <p className="rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm">{t("showcase.loading")}</p>;
  }

  if (error || !payload) {
    return <p className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error || t("showcase.payloadUnavailable")}</p>;
  }

  const { config, moments, next_anniversary: next } = payload;
  return (
    <div className="relative overflow-hidden rounded-[30px] border border-[#9c4f46]/20 bg-gradient-to-br from-[#fff8f1] via-[#ffe8d9] to-[#f4d0c4] p-5 sm:p-8">
      <div className="pointer-events-none absolute -right-14 top-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.85),rgba(156,79,70,0.2))] blur-sm" />

      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs uppercase tracking-[0.14em] text-[#2b2220]/70">{config.brand}</p>
          <button
            type="button"
            onClick={toggleMusic}
            disabled={musicDisabled}
            className="w-fit rounded-full border border-black/15 bg-white/70 px-4 py-2 text-sm font-semibold transition enabled:hover:-translate-y-0.5 disabled:opacity-60"
          >
            {musicDisabled ? t("showcase.musicNotSet") : isPlaying ? t("showcase.pauseSong") : t("showcase.playSong")}
          </button>
        </div>

        <p className="mt-4 inline-flex rounded-full border border-[#9c4f46]/30 bg-white/60 px-3 py-1 text-xs text-[#6f332f]">{tagText}</p>
        <h2 className="mt-3 font-display text-4xl leading-[0.95] sm:text-6xl">
          {config.hero_title}, <span>{config.couple_names}</span>
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-[#2b2220]/75">{config.hero_subtext}</p>

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
        <p className="mt-3 text-center text-sm text-[#2b2220]/70">
          {next.is_today ? t("showcase.todayMessage", { label: next.label }) : t("showcase.countdownMessage", { label: next.label })}
        </p>

        <p className="mt-5 text-center text-sm text-[#2b2220]/75">{t("showcase.togetherSince", { date: formatDate(config.wedding_date) })}</p>
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
      </header>

      <section className="mt-7">
        <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.journey")}</h3>
        <div className="mt-3 grid gap-3 border-l-2 border-dashed border-[#9c4f46]/30 pl-4 sm:pl-6">
          {config.timeline.map((item, index) => (
            <article key={`${item.title}-${index}`} className="rounded-2xl border border-[#9c4f46]/20 bg-white/55 p-4">
              <p className="font-display text-3xl">{item.title}</p>
              <p className="mt-1 text-sm text-[#2b2220]/75">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.moments")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {moments.map((moment) => (
            <article key={`${moment.year}-${moment.date}`} className="rounded-2xl border border-[#9c4f46]/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.72),rgba(244,208,196,0.45))] p-4">
              <p className="inline-flex rounded-full border border-[#9c4f46]/25 bg-white/65 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-[#6f332f]">
                {t("showcase.badge", { year: moment.year, status: statusLabel(moment.status, t) })}
              </p>
              <p className="mt-2 font-display text-3xl">{moment.title}</p>
              <p className="text-sm font-semibold">{formatDate(moment.date)}</p>
              <p className="mt-2 text-sm text-[#2b2220]/75">{moment.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.memories")}</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {config.memory_cards.map((card: PublicMemoryCard, index: number) => (
            <button
              key={`${card.title}-${index}`}
              type="button"
              onClick={() => setSelectedNote(card.note)}
              className="rounded-2xl border border-[#9c4f46]/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.72),rgba(244,208,196,0.45))] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <p className="font-display text-3xl">{card.title}</p>
              <p className="text-sm text-[#2b2220]/75">{card.summary}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm text-[#6f332f]">{selectedNote || t("showcase.defaultNote")}</p>
      </section>

      <section className="mt-7">
        <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.letter")}</h3>
        <p className="mt-3 rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm leading-relaxed text-[#2b2220]/75">{config.letter}</p>
      </section>

      <p className="mt-6 border-t border-black/10 pt-4 text-sm text-[#2b2220]/70">{config.footer_text}</p>
      <audio ref={audioRef} src={config.music_url || ""} preload="none" />
    </div>
  );
}
