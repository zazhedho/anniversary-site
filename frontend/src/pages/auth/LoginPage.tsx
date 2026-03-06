import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import GoogleIdentityButton from "../../components/common/GoogleIdentityButton";
import PasswordInput from "../../components/common/PasswordInput";
import SiteFooter from "../../components/common/SiteFooter";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { normalizeTenantSlug, normalizeTenantSlugInput } from "../../utils/tenantSlug";

const ACTIVE_TENANT_STORAGE_KEY = "anniv_active_tenant_slug";
const SETUP_TENANT_SLUG_KEY = "anniv_setup_tenant_slug";

export default function LoginPage() {
  const { loginUser, loginWithGoogleUser } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googlePendingToken, setGooglePendingToken] = useState("");
  const [googleTenantSlug, setGoogleTenantSlug] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [error, setError] = useState("");
  const defaultPublicPath = `/${normalizeTenantSlug(import.meta.env.VITE_DEFAULT_PUBLIC_TENANT || "default") || "default"}`;
  const destination = (location.state as { from?: string } | undefined)?.from || "/app/dashboard";
  const showGoogleSlugModal = Boolean(googlePendingToken);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser({ email, password });
      navigate(destination, { replace: true });
    } catch (err) {
      const text = err instanceof Error ? err.message : t("login.error");
      setError(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleToken(idToken: string, slugInput?: string) {
    setGoogleLoading(true);
    setGoogleError("");
    setError("");
    try {
      const normalizedSlug = normalizeTenantSlug(slugInput || "");
      await loginWithGoogleUser({
        id_token: idToken,
        tenant_slug: normalizedSlug || undefined,
      });
      if (normalizedSlug) {
        localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, normalizedSlug);
        localStorage.setItem(SETUP_TENANT_SLUG_KEY, normalizedSlug);
      }
      setGooglePendingToken("");
      notifySuccess(t("login.googleSuccess"));
      navigate(destination, { replace: true });
    } catch (err) {
      const text = err instanceof Error ? err.message : t("login.error");
      const lower = text.toLowerCase();
      const needsSlug = lower.includes("tenant slug is required");
      if (needsSlug) {
        setGooglePendingToken(idToken);
        setGoogleError("");
      } else {
        setGoogleError(text);
        notifyError(text);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function onSubmitGoogleSlug() {
    if (!googlePendingToken) return;
    await handleGoogleToken(googlePendingToken, googleTenantSlug);
  }

  function closeGoogleSlugModal() {
    if (googleLoading) return;
    setGooglePendingToken("");
    setGoogleTenantSlug("");
    setGoogleError("");
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

            <div className="relative py-1">
              <div className="h-px w-full bg-[#9c4f46]/20" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff7f1] px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f332f]/70">
                {t("common.or")}
              </span>
            </div>

            <GoogleIdentityButton
              label={t("login.google")}
              disabled={loading}
              onCredential={async (idToken) => {
                await handleGoogleToken(idToken);
              }}
              onError={(message) => {
                setGoogleError(message);
              }}
            />

            {googleError ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{googleError}</p> : null}

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

      {showGoogleSlugModal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#2b2220]/55 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-[#9c4f46]/20 bg-[#fff9f3] p-4 shadow-[0_18px_40px_rgba(43,34,32,0.24)] sm:p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]/80">{t("login.google")}</p>
            <h3 className="mt-1 font-display text-4xl leading-[0.95]">{t("login.googleSlugTitle")}</h3>
            <p className="mt-2 text-sm text-[#2b2220]/75">{t("login.googleNeedSlug")}</p>

            <div className="mt-3 rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p>{t("login.googleSlugRuleOnce")}</p>
              <p className="mt-1">{t("login.googleSlugRuleMin")}</p>
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-semibold">{t("register.tenantSlugPlaceholder")}</span>
              <input
                type="text"
                value={googleTenantSlug}
                onChange={(event) => setGoogleTenantSlug(normalizeTenantSlugInput(event.target.value))}
                className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
                placeholder={t("register.tenantSlugPlaceholder")}
                minLength={3}
                maxLength={100}
                required
              />
            </label>

            {googleError ? <p className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{googleError}</p> : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeGoogleSlugModal}
                disabled={googleLoading}
                className="rounded-full border border-[#9c4f46]/25 bg-white px-4 py-2 text-sm font-semibold text-[#6f332f] disabled:opacity-70"
              >
                {t("login.googleCancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void onSubmitGoogleSlug();
                }}
                disabled={googleLoading || normalizeTenantSlug(googleTenantSlug).length < 3}
                className="rounded-full bg-[#9c4f46] px-5 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {googleLoading ? t("login.googleLoading") : t("login.googleContinue")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
