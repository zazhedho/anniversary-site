import { Link } from "react-router-dom";
import AnniversaryShowcase from "../../components/anniversary/AnniversaryShowcase";
import SiteFooter from "../../components/common/SiteFooter";

export default function PublicAnniversaryPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-6 text-[#2b2220]">
      <div className="mx-auto w-[min(1120px,96vw)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">Public Anniversary Page</p>
          <div className="space-x-2 text-sm">
            <Link to="/login" className="rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 font-semibold">Login</Link>
            <Link to="/dashboard" className="rounded-full bg-[#9c4f46] px-3 py-1.5 font-semibold text-white">Dashboard</Link>
          </div>
        </div>
        <AnniversaryShowcase />
        <SiteFooter className="mt-6" />
      </div>
    </main>
  );
}
