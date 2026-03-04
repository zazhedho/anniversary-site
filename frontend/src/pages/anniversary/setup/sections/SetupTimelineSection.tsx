import type { EditLanguage, TimelineFormItem, TranslateFn } from "../types";
import { setupFieldLimits } from "../fieldLimits";
import FieldCounter from "../FieldCounter";

type SetupTimelineSectionProps = {
  t: TranslateFn;
  editLanguage: EditLanguage;
  timeline: TimelineFormItem[];
  onAddTimeline: () => void;
  onRemoveTimeline: (index: number) => void;
  onTimelineFieldChange: (index: number, key: keyof TimelineFormItem, value: string) => void;
};

export default function SetupTimelineSection({
  t,
  editLanguage,
  timeline,
  onAddTimeline,
  onRemoveTimeline,
  onTimelineFieldChange,
}: SetupTimelineSectionProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{t("setup.sectionTimeline")}</p>
          <p className="text-xs text-[#2b2220]/70">{t("setup.sectionTimelineHint")}</p>
        </div>
        <button type="button" onClick={onAddTimeline} className="rounded-xl border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold">
          {t("setup.addTimeline")}
        </button>
      </div>

      {timeline.length === 0 ? <p className="text-sm text-[#2b2220]/65">{t("setup.emptyTimeline")}</p> : null}
      {timeline.map((item, index) => (
        <div key={`timeline-${index}`} className="rounded-xl border border-[#9c4f46]/15 bg-white/80 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f332f]">{t("setup.itemNumber", { number: index + 1 })}</p>
            <button type="button" onClick={() => onRemoveTimeline(index)} className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
              {t("setup.removeItem")}
            </button>
          </div>
          <input
            type="text"
            value={item.title[editLanguage]}
            onChange={(event) => onTimelineFieldChange(index, "title", event.target.value)}
            maxLength={setupFieldLimits.timelineTitle}
            placeholder={t("setup.placeholder.timelineTitle")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
          />
          <div className="flex justify-end">
            <FieldCounter value={item.title[editLanguage]} max={setupFieldLimits.timelineTitle} />
          </div>
          <textarea
            value={item.description[editLanguage]}
            onChange={(event) => onTimelineFieldChange(index, "description", event.target.value)}
            maxLength={setupFieldLimits.timelineDescription}
            placeholder={t("setup.placeholder.timelineDescription")}
            className="min-h-[80px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
          />
          <div className="flex justify-end">
            <FieldCounter value={item.description[editLanguage]} max={setupFieldLimits.timelineDescription} />
          </div>
        </div>
      ))}
    </article>
  );
}
