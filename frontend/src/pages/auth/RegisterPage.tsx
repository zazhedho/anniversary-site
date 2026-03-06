import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import GoogleIdentityButton from "../../components/common/GoogleIdentityButton";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordValidationHint from "../../components/common/PasswordValidationHint";
import SiteFooter from "../../components/common/SiteFooter";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { register } from "../../services/authService";
import { normalizeTenantSlug, normalizeTenantSlugInput } from "../../utils/tenantSlug";
import { isPasswordValid, validatePassword } from "../../utils/passwordValidation";

const ACTIVE_TENANT_STORAGE_KEY = "anniv_active_tenant_slug";
const SETUP_TENANT_SLUG_KEY = "anniv_setup_tenant_slug";

export default function RegisterPage() {
  const { loginWithGoogleUser } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [slugModalOpen, setSlugModalOpen] = useState(false);
  const [slugModalMode, setSlugModalMode] = useState<"register" | "google">("register");
  const [slugModalError, setSlugModalError] = useState("");
  const [googlePendingToken, setGooglePendingToken] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [error, setError] = useState("");
  const defaultPublicPath = `/${normalizeTenantSlug(import.meta.env.VITE_DEFAULT_PUBLIC_TENANT || "default") || "default"}`;

  async function submitEmailRegister(slugInput: string) {
    setLoading(true);
    setError("");
    setSlugModalError("");

    try {
      await register({ name, email, phone, password, tenant_slug: slugInput });
      localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, slugInput);
      localStorage.setItem(SETUP_TENANT_SLUG_KEY, slugInput);
      setSlugModalOpen(false);
      notifySuccess(t("register.success"));
      navigate("/app/login", { replace: true });
    } catch (err) {
      const text = err instanceof Error ? err.message : t("register.error");
      setError(text);
      setSlugModalError(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const validation = validatePassword(password);
    if (!isPasswordValid(validation)) {
      const text = t("password.error.requirements");
      setError(text);
      notifyError(text);
      return;
    }
    if (password !== confirmPassword) {
      const text = t("password.error.mismatch");
      setError(text);
      notifyError(text);
      return;
    }

    setSlugModalMode("register");
    setSlugModalError("");
    setSlugModalOpen(true);
  }

  async function handleGoogleRegister(idToken: string, slugInput?: string) {
    const normalizedTenantSlug = normalizeTenantSlug(slugInput || "");
    setGoogleLoading(true);
    setGoogleError("");
    setError("");
    try {
      await loginWithGoogleUser({
        id_token: idToken,
        tenant_slug: normalizedTenantSlug || undefined,
      });
      if (normalizedTenantSlug) {
        localStorage.setItem(ACTIVE_TENANT_STORAGE_KEY, normalizedTenantSlug);
        localStorage.setItem(SETUP_TENANT_SLUG_KEY, normalizedTenantSlug);
      }
      setGooglePendingToken("");
      setSlugModalOpen(false);
      setSlugModalError("");
      notifySuccess(t("register.googleSuccess"));
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      const text = err instanceof Error ? err.message : t("register.error");
      const lower = text.toLowerCase();
      const needsSlug = lower.includes("tenant slug is required");
      if (needsSlug) {
        setGooglePendingToken(idToken);
        setSlugModalMode("google");
        setSlugModalError("");
        setSlugModalOpen(true);
      } else {
        setGoogleError(text);
        setSlugModalError(text);
        notifyError(text);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  async function onSubmitSlugModal() {
    const normalizedTenantSlug = normalizeTenantSlug(tenantSlug);
    if (!normalizedTenantSlug) {
      const text = t("register.slugRequired");
      setSlugModalError(text);
      notifyError(text);
      return;
    }

    if (slugModalMode === "register") {
      await submitEmailRegister(normalizedTenantSlug);
      return;
    }

    if (!googlePendingToken) {
      const text = t("register.error");
      setSlugModalError(text);
      notifyError(text);
      return;
    }
    await handleGoogleRegister(googlePendingToken, normalizedTenantSlug);
  }

  function closeSlugModal() {
    if (loading || googleLoading) return;
    setSlugModalOpen(false);
    setSlugModalError("");
    if (slugModalMode === "google") {
      setGooglePendingToken("");
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-10 text-[#2b2220]">
      <div className="grid flex-1 place-items-center">
        <AuthCard title={t("register.title")} subtitle={t("register.subtitle")}>
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder={t("common.name")} value={name} onChange={(e) => setName(e.target.value)} required />
            <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder={t("common.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder={t("common.phone")} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <PasswordInput className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder={t("common.password")} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PasswordInput
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm"
              placeholder={t("common.confirmPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <PasswordValidationHint password={password} confirmPassword={confirmPassword} showMatchHint />

            {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white">
              {loading ? t("register.submitting") : t("register.submit")}
            </button>

            <div className="relative py-1">
              <div className="h-px w-full bg-[#9c4f46]/20" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fff7f1] px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6f332f]/70">
                {t("common.or")}
              </span>
            </div>

            <GoogleIdentityButton
              label={t("register.google")}
              disabled={loading}
              onCredential={async (idToken) => {
                await handleGoogleRegister(idToken, tenantSlug);
              }}
              onError={(message) => setGoogleError(message)}
            />

            {googleError ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{googleError}</p> : null}

            <p className="text-sm text-[#2b2220]/70">
              {t("register.already")} <Link to="/app/login" className="font-semibold text-[#6f332f]">{t("login.submit")}</Link>
            </p>
            <p className="text-sm text-[#2b2220]/70">
              {t("register.seePublic")} <Link to={defaultPublicPath} className="font-semibold text-[#6f332f]">{t("register.openPublic")}</Link>
            </p>
          </form>
        </AuthCard>
      </div>
      <div className="mx-auto w-full max-w-md">
        <SiteFooter />
      </div>

      {slugModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#2b2220]/55 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-[#9c4f46]/20 bg-[#fff9f3] p-4 shadow-[0_18px_40px_rgba(43,34,32,0.24)] sm:p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]/80">{slugModalMode === "google" ? t("login.google") : t("register.title")}</p>
            <h3 className="mt-1 font-display text-4xl leading-[0.95]">{t("register.slugModalTitle")}</h3>
            <p className="mt-2 text-sm text-[#2b2220]/75">{t("register.slugModalSubtitle")}</p>

            <div className="mt-3 rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <p>{t("login.googleSlugRuleOnce")}</p>
              <p className="mt-1">{t("login.googleSlugRuleMin")}</p>
            </div>

            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-semibold">{t("register.tenantSlugPlaceholder")}</span>
              <input
                type="text"
                value={tenantSlug}
                onChange={(event) => setTenantSlug(normalizeTenantSlugInput(event.target.value))}
                className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
                placeholder={t("register.tenantSlugPlaceholder")}
                minLength={3}
                maxLength={100}
                required
              />
            </label>

            {slugModalError ? <p className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{slugModalError}</p> : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeSlugModal}
                disabled={loading || googleLoading}
                className="rounded-full border border-[#9c4f46]/25 bg-white px-4 py-2 text-sm font-semibold text-[#6f332f] disabled:opacity-70"
              >
                {t("login.googleCancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void onSubmitSlugModal();
                }}
                disabled={loading || googleLoading || normalizeTenantSlug(tenantSlug).length < 3}
                className="rounded-full bg-[#9c4f46] px-5 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {loading || googleLoading ? t("register.submitting") : slugModalMode === "google" ? t("login.googleContinue") : t("register.slugSubmit")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
