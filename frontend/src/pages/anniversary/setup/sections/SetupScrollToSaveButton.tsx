type SetupScrollToSaveButtonProps = {
  onClick: () => void;
};

export default function SetupScrollToSaveButton({ onClick }: SetupScrollToSaveButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scroll to save section"
      title="Scroll to save section"
      className="fixed bottom-5 right-5 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#9c4f46] text-white shadow-[0_14px_30px_rgba(111,51,47,0.35)] transition hover:-translate-y-0.5 hover:bg-[#7f3f37]"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 5v14" />
        <path d="m6 13 6 6 6-6" />
      </svg>
    </button>
  );
}
