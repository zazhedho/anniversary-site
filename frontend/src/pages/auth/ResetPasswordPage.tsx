import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import { resetPassword } from "../../services/authService";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, new_password: newPassword });
      setMessage("Password berhasil direset. Silakan login.");
      setToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-10 text-[#2b2220]">
      <AuthCard title="Reset" subtitle="Masukkan token reset dan buat kata sandi baru.">
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder="Reset Token" value={token} onChange={(e) => setToken(e.target.value)} required />
          <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

          {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white">
            {loading ? "Updating..." : "Reset Password"}
          </button>

          <p className="text-sm text-[#2b2220]/70">
            Kembali ke <Link to="/login" className="font-semibold text-[#6f332f]">Login</Link>
          </p>
        </form>
      </AuthCard>
    </main>
  );
}
