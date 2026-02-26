import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-[#fff8f1] px-5">
      <div className="text-center">
        <p className="font-display text-7xl text-[#9c4f46]">404</p>
        <p className="text-sm text-[#2b2220]/70">Halaman tidak ditemukan.</p>
        <Link to="/dashboard" className="mt-4 inline-block rounded-full bg-[#9c4f46] px-4 py-2 text-sm font-semibold text-white">
          Kembali ke Dashboard
        </Link>
      </div>
    </main>
  );
}
