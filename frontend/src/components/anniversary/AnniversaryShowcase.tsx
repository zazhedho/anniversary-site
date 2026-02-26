import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPublicAnniversary } from "../../services/publicService";
import type { MemoryCard, PublicPayload } from "../../types/anniversary";

type CountdownState = { days: number; hours: number; minutes: number };

const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" });

function parseDate(value: string): Date | null {
  const parsed = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value: string): string {
  const parsed = parseDate(value);
  return parsed ? dateFormatter.format(parsed) : "-";
}

function toCountdown(target: Date): CountdownState {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalMinutes = Math.floor(diff / 1000 / 60);
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
  };
}

function statusLabel(status: "done" | "today" | "upcoming"): string {
  if (status === "done") return "Sudah Dirayakan";
  if (status === "today") return "Hari Ini";
  return "Akan Datang";
}

export default function AnniversaryShowcase() {
  const [payload, setPayload] = useState<PublicPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNote, setSelectedNote] = useState("Klik salah satu kartu untuk lihat pesan spesial.");
  const [countdown, setCountdown] = useState<CountdownState>({ days: 0, hours: 0, minutes: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchPublicAnniversary();
        if (!mounted) return;
        setPayload(data);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Gagal memuat data anniversary.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!payload || payload.next_anniversary.is_today) return;

    const target = parseDate(payload.next_anniversary.date);
    if (!target) return;

    const update = () => setCountdown(toCountdown(target));
    update();

    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [payload]);

  const tagText = useMemo(() => {
    if (!payload) return "Memuat tanggal anniversary...";

    return `Wedding Date: ${formatDate(payload.config.wedding_date)} | Next: ${payload.next_anniversary.label} (${formatDate(
      payload.next_anniversary.date
    )})`;
  }, [payload]);

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
    return <p className="rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm">Loading anniversary payload...</p>;
  }

  if (error || !payload) {
    return <p className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error || "Payload tidak tersedia"}</p>;
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
            {musicDisabled ? "Musik belum diset" : isPlaying ? "Pause Song" : "Play Song"}
          </button>
        </div>

        <p className="mt-4 inline-flex rounded-full border border-[#9c4f46]/30 bg-white/60 px-3 py-1 text-xs text-[#6f332f]">{tagText}</p>
        <h2 className="mt-3 font-display text-4xl leading-[0.95] sm:text-6xl">
          {config.hero_title}, <span>{config.couple_names}</span>
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-[#2b2220]/75">{config.hero_subtext}</p>

        <div className="mt-6 grid max-w-md grid-cols-3 gap-2">
          {[
            ["Hari", countdown.days],
            ["Jam", countdown.hours],
            ["Menit", countdown.minutes],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-3 text-center">
              <p className="font-display text-3xl text-[#6f332f]">{String(value).padStart(2, "0")}</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#2b2220]/65">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#2b2220]/70">
          {next.is_today ? `Selamat ${next.label}! Hari ini hari spesial kalian.` : `Menghitung mundur ke ${next.label}.`}
        </p>
      </header>

      <section className="mt-7">
        <h3 className="font-display text-3xl sm:text-4xl">Perjalanan Kita</h3>
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
        <h3 className="font-display text-3xl sm:text-4xl">Momen Per Tahun</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {moments.map((moment) => (
            <article key={`${moment.year}-${moment.date}`} className="rounded-2xl border border-[#9c4f46]/20 bg-[linear-gradient(160deg,rgba(255,255,255,0.72),rgba(244,208,196,0.45))] p-4">
              <p className="inline-flex rounded-full border border-[#9c4f46]/25 bg-white/65 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-[#6f332f]">
                Anniversary ke-{moment.year} • {statusLabel(moment.status)}
              </p>
              <p className="mt-2 font-display text-3xl">{moment.title}</p>
              <p className="text-sm font-semibold">{formatDate(moment.date)}</p>
              <p className="mt-2 text-sm text-[#2b2220]/75">{moment.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h3 className="font-display text-3xl sm:text-4xl">Kotak Kenangan</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {config.memory_cards.map((card: MemoryCard, index: number) => (
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
        <p className="mt-3 rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm text-[#6f332f]">{selectedNote}</p>
      </section>

      <section className="mt-7">
        <h3 className="font-display text-3xl sm:text-4xl">Surat Untukmu</h3>
        <p className="mt-3 rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm leading-relaxed text-[#2b2220]/75">{config.letter}</p>
      </section>

      <footer className="mt-6 border-t border-black/10 pt-4 text-sm text-[#2b2220]/70">{config.footer_text}</footer>
      <audio ref={audioRef} src={config.music_url || ""} preload="none" />
    </div>
  );
}
