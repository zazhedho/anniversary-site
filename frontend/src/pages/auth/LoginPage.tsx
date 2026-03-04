import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import PasswordInput from "../../components/common/PasswordInput";
import SiteFooter from "../../components/common/SiteFooter";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { normalizeTenantSlug } from "../../utils/tenantSlug";

export default function LoginPage() {
  const { loginUser } = useAuth();
  const { t } = useLanguage();
  const { notifyError } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const defaultPublicPath = `/${normalizeTenantSlug(import.meta.env.VITE_DEFAULT_PUBLIC_TENANT || "default") || "default"}`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser({ email, password });
      const destination = (location.state as { from?: string } | undefined)?.from || "/app/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      const text = err instanceof Error ? err.message : t("login.error");
      setError(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-10 text-[#2b2220]">
      <div className="mx-auto grid w-full max-w-[1120px] flex-1 place-items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:place-items-stretch lg:items-center">
        <section className="hidden lg:block">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">{t("login.tag")}</p>
          <h2 className="mt-3 font-display text-7xl leading-[0.9]">{t("login.heading")}</h2>
          <p className="mt-4 max-w-xl text-sm text-[#2b2220]/70">
            {t("login.description")}
          </p>
        </section>

        <AuthCard title={t("login.title")} subtitle={t("login.subtitle")}>
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t("common.email")}</span>
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
              <span className="mb-1 block text-sm font-semibold">{t("common.password")}</span>
              <PasswordInput
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
              {loading ? t("login.signingIn") : t("login.submit")}
            </button>

            <div className="space-y-1 text-sm text-[#2b2220]/70">
              <p>
                {t("login.noAccount")} <Link to="/app/register" className="font-semibold text-[#6f332f]">{t("login.register")}</Link>
              </p>
              <p>
                <Link to="/app/forgot-password" className="font-semibold text-[#6f332f]">{t("login.forgotPrompt")}</Link>
              </p>
            </div>

            <div className="pt-1 flex justify-end">
              <Link
                to={defaultPublicPath}
                className="inline-flex items-center rounded-full border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-sm font-semibold text-[#6f332f] transition hover:-translate-y-0.5 hover:bg-[#fff6f0]"
              >
                {t("login.viewPublic")}
              </Link>
            </div>
          </form>
        </AuthCard>
      </div>
      <div className="mx-auto w-full max-w-[1120px]">
        <SiteFooter />
      </div>
    </main>
  );
}
