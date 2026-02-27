import type { TranslateFn } from "../types";

type SetupSaveSectionProps = {
  t: TranslateFn;
  saving: boolean;
  tokenMissing: boolean;
};

export default function SetupSaveSection({ t, saving, tokenMissing }: SetupSaveSectionProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={tokenMissing || saving}
          className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? t("setup.saving") : t("setup.saveAll")}
        </button>
      </div>
    </article>
  );
}
