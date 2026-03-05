import type { EditLanguage, MomentFormItem, TranslateFn } from "../types";
import { setupFieldLimits } from "../fieldLimits";
import FieldCounter from "../FieldCounter";

type SetupMomentsSectionProps = {
  t: TranslateFn;
  editLanguage: EditLanguage;
  annualMoments: MomentFormItem[];
  onAddMoment: () => void;
  onRemoveMoment: (index: number) => void;
  onMomentFieldChange: (index: number, key: keyof MomentFormItem, value: string | number) => void;
};

export default function SetupMomentsSection({
  t,
  editLanguage,
  annualMoments,
  onAddMoment,
  onRemoveMoment,
  onMomentFieldChange,
}: SetupMomentsSectionProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{t("setup.sectionMoments")}</p>
          <p className="text-xs text-[#2b2220]/70">{t("setup.sectionMomentsHint")}</p>
        </div>
        <button type="button" onClick={onAddMoment} className="rounded-xl border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold">
          {t("setup.addAnnualMoment")}
        </button>
      </div>

      {annualMoments.length === 0 ? <p className="text-sm text-[#2b2220]/65">{t("setup.emptyMoments")}</p> : null}
      {annualMoments.map((item, index) => (
        <div key={`moment-${index}`} className="rounded-xl border border-[#9c4f46]/15 bg-white/80 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f332f]">{t("setup.itemNumber", { number: index + 1 })}</p>
            <button type="button" onClick={() => onRemoveMoment(index)} className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
              {t("setup.removeItem")}
            </button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            <input
              type="number"
              min={1}
              value={item.year}
              onChange={(event) => onMomentFieldChange(index, "year", Number(event.target.value))}
              placeholder={t("setup.placeholder.momentYear")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
            <input
              type="date"
              value={item.date}
              onChange={(event) => onMomentFieldChange(index, "date", event.target.value)}
              placeholder={t("setup.placeholder.momentDate")}
              title={t("setup.placeholder.momentDate")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
          </div>
          <input
            type="text"
            value={item.title[editLanguage]}
            onChange={(event) => onMomentFieldChange(index, "title", event.target.value)}
            maxLength={setupFieldLimits.momentTitle}
            placeholder={t("setup.placeholder.momentTitle")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
          />
          <div className="flex justify-end">
            <FieldCounter value={item.title[editLanguage]} max={setupFieldLimits.momentTitle} />
          </div>
          <textarea
            value={item.note[editLanguage]}
            onChange={(event) => onMomentFieldChange(index, "note", event.target.value)}
            maxLength={setupFieldLimits.momentNote}
            placeholder={t("setup.placeholder.momentNote")}
            className="min-h-[80px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
          />
          <div className="flex justify-end">
            <FieldCounter value={item.note[editLanguage]} max={setupFieldLimits.momentNote} />
          </div>
        </div>
      ))}
    </article>
  );
}
