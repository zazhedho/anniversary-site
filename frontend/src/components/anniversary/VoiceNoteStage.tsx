import { useMemo } from "react";

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type VoiceSource =
  | { kind: "none" }
  | { kind: "audio"; url: string }
  | { kind: "youtube"; url: string; embedUrl: string };

type VoiceNoteStageProps = {
  t: TranslateFn;
  url?: string;
};

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

function resolveVoiceSource(value?: string): VoiceSource {
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

export default function VoiceNoteStage({ t, url }: VoiceNoteStageProps) {
  const source = useMemo(() => resolveVoiceSource(url), [url]);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-[#9c4f46]/20 bg-white/80 p-4 text-center">
      <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">{t("showcase.game.voiceTitle")}</p>
      <p className="mt-2 text-sm text-[#2b2220]/75">{t("showcase.game.voiceSubtitle")}</p>

      {source.kind === "audio" ? (
        <audio controls preload="metadata" src={source.url} className="mt-4 w-full" />
      ) : null}

      {source.kind === "youtube" ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-[#9c4f46]/20 bg-black">
          <iframe
            src={source.embedUrl}
            title="Voice note"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-56 w-full sm:h-72"
          />
        </div>
      ) : null}

      {source.kind === "none" ? <p className="mt-4 text-sm text-[#2b2220]/70">{t("showcase.game.voiceUnavailable")}</p> : null}

      {source.kind !== "none" ? (
        <a
          href={source.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded-full border border-[#9c4f46]/30 bg-white px-4 py-1.5 text-sm font-semibold text-[#2b2220]"
        >
          {t("showcase.game.voiceOpenSource")}
        </a>
      ) : null}
    </div>
  );
}
