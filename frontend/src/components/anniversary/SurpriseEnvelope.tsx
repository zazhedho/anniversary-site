type SurpriseEnvelopeProps = {
  ctaLabel: string;
  isOpen: boolean;
  note: string;
  noteLabel: string;
  onNext: () => void;
};

export default function SurpriseEnvelope({ ctaLabel, isOpen, note, noteLabel, onNext }: SurpriseEnvelopeProps) {
  return (
    <div className="rounded-2xl border border-[#9c4f46]/20 bg-white/80 p-3 text-center sm:p-4">
      <style>{`
        @keyframes letterRise{0%{transform:translate(-50%,26px) scale(.98);opacity:0;}100%{transform:translate(-50%,-56px) scale(1);opacity:1;}}
        @keyframes letterFold{0%{transform:translate(-50%,-56px) scale(1);opacity:1;}100%{transform:translate(-50%,26px) scale(.98);opacity:0;}}
      `}</style>

      <div className="mx-auto w-full max-w-md">
        <div className="relative mx-auto h-60 w-full max-w-[320px] sm:h-64">
          <div className="absolute bottom-3 left-1/2 h-28 w-[86%] max-w-[272px] -translate-x-1/2 rounded-b-2xl border border-[#c78878] bg-[#f3cfc4]" />

          <div className="absolute bottom-3 left-1/2 h-24 w-[86%] max-w-[272px] -translate-x-1/2 [clip-path:polygon(0_0,50%_70%,100%_0,100%_100%,0_100%)] rounded-b-2xl border-x border-b border-[#c78878] bg-[#e8b9ab]" />

          <div
            className="absolute left-1/2 top-12 z-20 h-24 w-[86%] max-w-[272px] -translate-x-1/2 origin-top [clip-path:polygon(0_0,100%_0,50%_90%)] border border-[#c78878] bg-[#f9dfd6] transition-transform duration-700"
            style={{ transform: `translateX(-50%) perspective(1000px) rotateX(${isOpen ? 180 : 0}deg)` }}
          />

          <div
            className={`absolute left-1/2 top-24 z-10 w-[74%] max-w-[236px] rounded-xl border border-[#ead8d1] bg-white px-3 py-2.5 text-left shadow-lg sm:px-4 sm:py-3 ${isOpen ? "animate-[letterRise_520ms_cubic-bezier(0.16,1,0.3,1)_forwards]" : "animate-[letterFold_280ms_ease-in_forwards]"}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9c4f46]">{noteLabel}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#2b2220]/80 sm:mt-2 sm:text-sm">{note}</p>
          </div>

          <div className="absolute bottom-3 left-1/2 z-30 h-10 w-[86%] max-w-[272px] -translate-x-1/2 [clip-path:polygon(0_0,50%_95%,100%_0,100%_100%,0_100%)] border border-[#c78878] bg-[#e1ad9f]" />

          <div className="absolute bottom-2 left-1/2 z-40 h-8 w-8 -translate-x-1/2 rounded-full border border-[#b86d58] bg-[#f5c3b3] text-lg leading-8 text-[#8b3c32]">
            {"<3"}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!isOpen}
        className="mt-3 rounded-full bg-[#9c4f46] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-65"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
