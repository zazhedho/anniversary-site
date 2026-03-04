import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordValidationHint from "../../components/common/PasswordValidationHint";
import SiteFooter from "../../components/common/SiteFooter";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { register } from "../../services/authService";
import { normalizeTenantSlug, normalizeTenantSlugInput } from "../../utils/tenantSlug";
import { isPasswordValid, validatePassword } from "../../utils/passwordValidation";

export default function RegisterPage() {
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const defaultPublicPath = `/${normalizeTenantSlug(import.meta.env.VITE_DEFAULT_PUBLIC_TENANT || "default") || "default"}`;

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

    setLoading(true);

    try {
      await register({ name, email, phone, password, tenant_slug: normalizeTenantSlug(tenantSlug) });
      notifySuccess(t("register.success"));
      navigate("/app/login", { replace: true });
    } catch (err) {
      const text = err instanceof Error ? err.message : t("register.error");
      setError(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-10 text-[#2b2220]">
      <div className="grid flex-1 place-items-center">
        <AuthCard title={t("register.title")} subtitle={t("register.subtitle")}>
          <form onSubmit={onSubmit} className="space-y-3">
            <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder={t("common.name")} value={name} onChange={(e) => setName(e.target.value)} required />
            <input
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm"
              placeholder={t("register.tenantSlugPlaceholder")}
              value={tenantSlug}
              onChange={(e) => setTenantSlug(normalizeTenantSlugInput(e.target.value))}
              required
              minLength={3}
              maxLength={100}
            />
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
    </main>
  );
}
