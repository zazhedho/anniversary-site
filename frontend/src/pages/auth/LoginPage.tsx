import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import SiteFooter from "../../components/common/SiteFooter";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser({ email, password });
      const destination = (location.state as { from?: string } | undefined)?.from || "/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-10 text-[#2b2220]">
      <div className="mx-auto grid w-[min(1120px,96vw)] flex-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <section className="hidden lg:block">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">Anniversary Keepsake</p>
          <h2 className="mt-3 font-display text-7xl leading-[0.9]">Control Panel For Your Love Story</h2>
          <p className="mt-4 max-w-xl text-sm text-[#2b2220]/70">
            Login untuk mengelola data anniversary, update momen per tahun, dan menjaga konten personal tetap aman.
          </p>
        </section>

        <AuthCard title="Login" subtitle="Masuk untuk melanjutkan cerita manis kalian.">
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
                placeholder="********"
                required
              />
            </label>

            {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(112,51,47,0.24)] disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Login"}
            </button>

            <div className="flex items-center justify-between text-sm text-[#2b2220]/70">
              <div className="space-x-2">
                <Link to="/anniversary" className="font-semibold text-[#6f332f]">Public</Link>
                <span>/</span>
                <Link to="/register" className="font-semibold text-[#6f332f]">Register</Link>
              </div>
              <div className="space-x-2">
                <Link to="/forgot-password" className="font-semibold text-[#6f332f]">Forgot</Link>
                <span>/</span>
                <Link to="/reset-password" className="font-semibold text-[#6f332f]">Reset</Link>
              </div>
            </div>
          </form>
        </AuthCard>
      </div>
      <div className="mx-auto w-[min(1120px,96vw)]">
        <SiteFooter />
      </div>
    </main>
  );
}
