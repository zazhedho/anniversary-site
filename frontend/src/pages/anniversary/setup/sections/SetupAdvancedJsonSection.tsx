import type { TranslateFn } from "../types";

type SetupAdvancedJsonSectionProps = {
  t: TranslateFn;
  advancedJson: string;
  onAdvancedJsonChange: (value: string) => void;
  onApplyJson: () => void;
  onRefreshJson: () => void;
};

export default function SetupAdvancedJsonSection({
  t,
  advancedJson,
  onAdvancedJsonChange,
  onApplyJson,
  onRefreshJson,
}: SetupAdvancedJsonSectionProps) {
  return (
    <details className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <summary className="cursor-pointer text-sm font-semibold">{t("setup.advancedMode")}</summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs text-[#2b2220]/70">{t("setup.advancedTips")}</p>
        <textarea
          value={advancedJson}
          onChange={(event) => onAdvancedJsonChange(event.target.value)}
          className="min-h-[320px] w-full rounded-xl border border-[#9c4f46]/20 bg-[#2b2220] p-3 font-mono text-xs text-[#ffe8d9] outline-none focus:border-[#9c4f46]"
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onApplyJson}
            className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2 text-sm font-semibold"
          >
            {t("setup.applyJson")}
          </button>
          <button
            type="button"
            onClick={onRefreshJson}
            className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2 text-sm font-semibold"
          >
            {t("setup.refreshJson")}
          </button>
        </div>
      </div>
    </details>
  );
}
