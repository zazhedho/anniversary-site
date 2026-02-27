import type { TranslateFn } from "../types";

type SetupHeaderCardProps = {
  t: TranslateFn;
};

export default function SetupHeaderCard({ t }: SetupHeaderCardProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("setup.tag")}</p>
      <h1 className="mt-1 font-display text-4xl leading-none">{t("setup.title")}</h1>
      <p className="mt-2 text-sm text-[#2b2220]/75">{t("setup.friendlySubtitle")}</p>
      <p className="mt-2 text-xs text-[#2b2220]/65">{t("setup.quickGuide")}</p>
    </article>
  );
}
