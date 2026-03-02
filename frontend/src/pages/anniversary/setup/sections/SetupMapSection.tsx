import type { EditLanguage, MapFormItem, TranslateFn } from "../types";

type SetupMapSectionProps = {
  t: TranslateFn;
  editLanguage: EditLanguage;
  mapPoints: MapFormItem[];
  onAddMapPoint: () => void;
  onRemoveMapPoint: (index: number) => void;
  onMapPointLocalizedFieldChange: (index: number, key: "title" | "note", value: string) => void;
  onMapPointCoordinateChange: (index: number, key: "lat" | "lng", value: string) => void;
};

export default function SetupMapSection({
  t,
  editLanguage,
  mapPoints,
  onAddMapPoint,
  onRemoveMapPoint,
  onMapPointLocalizedFieldChange,
  onMapPointCoordinateChange,
}: SetupMapSectionProps) {
  return (
    <article className="space-y-3 rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{t("setup.sectionMap")}</p>
          <p className="text-xs text-[#2b2220]/70">{t("setup.sectionMapHint")}</p>
        </div>
        <button type="button" onClick={onAddMapPoint} className="rounded-xl border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold">
          {t("setup.addMapPoint")}
        </button>
      </div>

      {mapPoints.length === 0 ? <p className="text-sm text-[#2b2220]/65">{t("setup.emptyMapPoints")}</p> : null}
      {mapPoints.map((item, index) => (
        <div key={`map-point-${index}`} className="space-y-2 rounded-xl border border-[#9c4f46]/15 bg-white/80 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f332f]">{t("setup.itemNumber", { number: index + 1 })}</p>
            <button type="button" onClick={() => onRemoveMapPoint(index)} className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
              {t("setup.removeItem")}
            </button>
          </div>
          <input
            type="text"
            value={item.title[editLanguage]}
            onChange={(event) => onMapPointLocalizedFieldChange(index, "title", event.target.value)}
            placeholder={t("setup.placeholder.mapPointTitle")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              type="text"
              inputMode="decimal"
              value={item.lat}
              onChange={(event) => onMapPointCoordinateChange(index, "lat", event.target.value)}
              placeholder={t("setup.placeholder.mapPointLat")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
            <input
              type="text"
              inputMode="decimal"
              value={item.lng}
              onChange={(event) => onMapPointCoordinateChange(index, "lng", event.target.value)}
              placeholder={t("setup.placeholder.mapPointLng")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
          </div>
          <textarea
            value={item.note[editLanguage]}
            onChange={(event) => onMapPointLocalizedFieldChange(index, "note", event.target.value)}
            placeholder={t("setup.placeholder.mapPointNote")}
            className="min-h-[80px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
          />
        </div>
      ))}
    </article>
  );
}
