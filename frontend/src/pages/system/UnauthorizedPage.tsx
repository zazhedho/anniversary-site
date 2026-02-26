import { Link } from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-[#fff8f1] px-5">
      <div className="text-center">
        <p className="font-display text-7xl text-[#9c4f46]">403</p>
        <p className="text-sm text-[#2b2220]/70">Kamu tidak punya permission untuk mengakses halaman ini.</p>
        <Link to="/anniversary" className="mt-4 inline-block rounded-full bg-[#9c4f46] px-4 py-2 text-sm font-semibold text-white">
          Kembali ke Anniversary
        </Link>
      </div>
    </main>
  );
}
