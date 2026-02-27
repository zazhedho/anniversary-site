import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import SiteFooter from "../../components/common/SiteFooter";
import { register } from "../../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({ name, email, phone, password });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-10 text-[#2b2220]">
      <div className="grid flex-1 place-items-center">
        <AuthCard title="Register" subtitle="Buat akun untuk menyiapkan kejutan manis di momen anniversary kalian.">
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white">
              {loading ? "Submitting..." : "Create Account"}
            </button>

            <p className="text-sm text-[#2b2220]/70">
              Sudah punya akun? <Link to="/login" className="font-semibold text-[#6f332f]">Login</Link>
            </p>
            <p className="text-sm text-[#2b2220]/70">
              Ingin lihat versi publik? <Link to="/anniversary" className="font-semibold text-[#6f332f]">Buka Public Page</Link>
            </p>
          </form>
        </AuthCard>
      </div>
      <div className="mx-auto w-full max-w-md">
        <SiteFooter />
      </div>
    </main>
  );
}
