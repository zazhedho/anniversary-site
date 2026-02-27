type SiteFooterProps = {
  note?: string;
  className?: string;
};

export default function SiteFooter({ note, className = "" }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`border-t border-black/10 pt-4 text-center text-sm text-[#2b2220]/70 ${className}`.trim()}>
      {note ? <p>{note}</p> : null}
      <p className={note ? "mt-1 text-xs text-[#2b2220]/60" : "text-xs text-[#2b2220]/60"}>
        Copyright © {currentYear} Zaidus Zhuhur
      </p>
    </footer>
  );
}
