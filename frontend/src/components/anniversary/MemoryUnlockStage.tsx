export type UnlockMemoryCard = {
  id: string;
  title: string;
  summary: string;
  note: string;
};

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

type MemoryUnlockStageProps = {
  t: TranslateFn;
  cards: UnlockMemoryCard[];
  revealedIds: string[];
  requiredCount: number;
  focusedCard?: UnlockMemoryCard;
  onReveal: (id: string) => void;
};

export default function MemoryUnlockStage({
  t,
  cards,
  revealedIds,
  requiredCount,
  focusedCard,
  onReveal,
}: MemoryUnlockStageProps) {
  const canRevealMore = revealedIds.length < requiredCount;

  if (cards.length === 0) {
    return (
      <div className="rounded-2xl border border-[#9c4f46]/20 bg-white/75 p-4 text-sm text-[#2b2220]/75">
        {t("showcase.game.unlockEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#2b2220]/75">{t("showcase.game.unlockPrompt")}</p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cards.map((card) => {
          const revealed = revealedIds.includes(card.id);
          const disabled = revealed || !canRevealMore;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onReveal(card.id)}
              disabled={disabled}
              className={`group rounded-2xl border p-3 text-left transition ${revealed ? "border-[#9c4f46]/45 bg-white shadow-sm" : "border-[#9c4f46]/20 bg-white/70 hover:-translate-y-0.5 hover:bg-white"} disabled:cursor-default disabled:opacity-95`}
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#6f332f]/70">
                {revealed ? t("showcase.game.unlockRevealed") : t("showcase.game.unlockLocked")}
              </p>
              <p className="mt-1 font-display text-2xl leading-tight text-[#2b2220]">{revealed ? card.title : t("showcase.game.unlockCardTitle")}</p>
              <p className="mt-1 text-xs text-[#2b2220]/70 line-clamp-2">{revealed ? card.summary : t("showcase.game.unlockCardHint")}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[#9c4f46]/20 bg-white/75 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("showcase.game.noteLabel")}</p>
        <p className="mt-2 text-sm leading-relaxed text-[#2b2220]/80">
          {focusedCard?.note || t("showcase.game.unlockNotePlaceholder")}
        </p>
      </div>
    </div>
  );
}
