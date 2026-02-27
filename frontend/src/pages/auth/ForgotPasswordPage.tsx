import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await forgotPassword({ email });
      setMessage("Permintaan reset berhasil dibuat. Silakan lanjutkan dengan token reset yang kamu punya.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-10 text-[#2b2220]">
      <AuthCard title="Forgot" subtitle="Masukkan email untuk memulihkan akses akunmu.">
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white">
            {loading ? "Sending..." : "Request Reset"}
          </button>

          <p className="text-sm text-[#2b2220]/70">
            Sudah ingat password? <Link to="/login" className="font-semibold text-[#6f332f]">Login</Link>
          </p>
        </form>
      </AuthCard>
    </main>
  );
}
