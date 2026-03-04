import type { EditLanguage, MemoryFormItem, TranslateFn } from "../types";
import { setupFieldLimits } from "../fieldLimits";

type SetupMemoriesSectionProps = {
  t: TranslateFn;
  editLanguage: EditLanguage;
  memoryCards: MemoryFormItem[];
  onAddMemory: () => void;
  onRemoveMemory: (index: number) => void;
  onMemoryFieldChange: (index: number, key: keyof MemoryFormItem, value: string) => void;
};

export default function SetupMemoriesSection({
  t,
  editLanguage,
  memoryCards,
  onAddMemory,
  onRemoveMemory,
  onMemoryFieldChange,
}: SetupMemoriesSectionProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{t("setup.sectionMemories")}</p>
          <p className="text-xs text-[#2b2220]/70">{t("setup.sectionMemoriesHint")}</p>
        </div>
        <button type="button" onClick={onAddMemory} className="rounded-xl border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold">
          {t("setup.addMemory")}
        </button>
      </div>

      {memoryCards.length === 0 ? <p className="text-sm text-[#2b2220]/65">{t("setup.emptyMemories")}</p> : null}
      {memoryCards.map((item, index) => (
        <div key={`memory-${index}`} className="rounded-xl border border-[#9c4f46]/15 bg-white/80 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f332f]">{t("setup.itemNumber", { number: index + 1 })}</p>
            <button type="button" onClick={() => onRemoveMemory(index)} className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
              {t("setup.removeItem")}
            </button>
          </div>
          <input
            type="text"
            value={item.title[editLanguage]}
            onChange={(event) => onMemoryFieldChange(index, "title", event.target.value)}
            maxLength={setupFieldLimits.memoryTitle}
            placeholder={t("setup.placeholder.memoryTitle")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
          />
          <input
            type="text"
            value={item.summary[editLanguage]}
            onChange={(event) => onMemoryFieldChange(index, "summary", event.target.value)}
            maxLength={setupFieldLimits.memorySummary}
            placeholder={t("setup.placeholder.memorySummary")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
          />
          <textarea
            value={item.note[editLanguage]}
            onChange={(event) => onMemoryFieldChange(index, "note", event.target.value)}
            maxLength={setupFieldLimits.memoryNote}
            placeholder={t("setup.placeholder.memoryNote")}
            className="min-h-[80px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
          />
        </div>
      ))}
    </article>
  );
}
