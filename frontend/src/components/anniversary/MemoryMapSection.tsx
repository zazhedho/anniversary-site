import { useEffect, useMemo, useState } from "react";
import type { PublicMapPoint } from "../../types/anniversary";

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type MemoryMapSectionProps = {
  t: TranslateFn;
  points: PublicMapPoint[];
};

function hasValidCoordinate(point: PublicMapPoint): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180 &&
    !(point.lat === 0 && point.lng === 0)
  );
}

function toMapEmbedUrl(point: PublicMapPoint): string {
  const query = encodeURIComponent(`${point.lat},${point.lng}`);
  return `https://maps.google.com/maps?q=${query}&z=18&output=embed`;
}

function toMapExternalUrl(point: PublicMapPoint): string {
  const query = encodeURIComponent(`${point.lat},${point.lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export default function MemoryMapSection({ t, points }: MemoryMapSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const validPoints = useMemo(() => points.filter(hasValidCoordinate), [points]);
  const selectedPoint = useMemo(() => validPoints[selectedIndex], [selectedIndex, validPoints]);
  const embedUrl = useMemo(() => (selectedPoint ? toMapEmbedUrl(selectedPoint) : ""), [selectedPoint]);
  const externalUrl = useMemo(() => (selectedPoint ? toMapExternalUrl(selectedPoint) : ""), [selectedPoint]);

  useEffect(() => {
    if (selectedIndex <= validPoints.length - 1) return;
    setSelectedIndex(0);
  }, [selectedIndex, validPoints.length]);

  if (validPoints.length === 0) {
    return (
      <section>
        <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.mapTitle")}</h3>
        <p className="mt-3 rounded-2xl border border-[#9c4f46]/20 bg-white/60 p-4 text-sm text-[#2b2220]/75">{t("showcase.mapEmpty")}</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="font-display text-3xl sm:text-4xl">{t("showcase.mapTitle")}</h3>
      <p className="mt-2 text-sm text-[#2b2220]/75">{t("showcase.mapHint")}</p>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="overflow-hidden rounded-2xl border border-[#9c4f46]/20 bg-white/70">
          <iframe title="Our memory map" src={embedUrl} className="h-72 w-full sm:h-80" loading="lazy" />
        </div>

        <div className="space-y-2">
          <p className="rounded-xl border border-[#9c4f46]/20 bg-white/70 px-3 py-2 text-xs text-[#2b2220]/70">
            {t("showcase.mapSelectPrompt")}
          </p>
          <div className="grid gap-2">
            {validPoints.map((point, index) => {
              const active = index === selectedIndex;
              return (
                <button
                  key={`${point.title}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${active ? "border-[#9c4f46] bg-white shadow-sm" : "border-[#9c4f46]/20 bg-white/70 hover:bg-white"}`}
                >
                  <p className="font-semibold text-[#2b2220]">{point.title}</p>
                  <p className="text-[11px] text-[#2b2220]/65">
                    {point.lat.toFixed(7)}, {point.lng.toFixed(7)}
                  </p>
                </button>
              );
            })}
          </div>
          <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/75 p-4">
            <p className="font-display text-3xl">{selectedPoint.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[#2b2220]/80">{selectedPoint.note}</p>
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-full border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#2b2220]"
            >
              {t("showcase.mapOpenExternal")}
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
