import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordValidationHint from "../../components/common/PasswordValidationHint";
import { useLanguage } from "../../contexts/LocaleContext";
import { resetPassword } from "../../services/authService";
import { isPasswordValid, validatePassword } from "../../utils/passwordValidation";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
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

    const validation = validatePassword(newPassword);
    if (!isPasswordValid(validation)) {
      setError(t("password.error.requirements"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("password.error.mismatch"));
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, new_password: newPassword });
      setMessage(t("reset.success"));
      setToken("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reset.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-10 text-[#2b2220]">
      <AuthCard title={t("reset.title")} subtitle={t("reset.subtitle")}>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder={t("reset.token")} value={token} onChange={(e) => setToken(e.target.value)} required />
          <PasswordInput className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder={t("reset.newPassword")} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <PasswordInput className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder={t("reset.confirmPassword")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          <PasswordValidationHint password={newPassword} confirmPassword={confirmPassword} showMatchHint />

          {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white">
            {loading ? t("reset.updating") : t("reset.submit")}
          </button>

          <p className="text-sm text-[#2b2220]/70">
            {t("reset.backTo")} <Link to="/login" className="font-semibold text-[#6f332f]">{t("login.submit")}</Link>
          </p>
        </form>
      </AuthCard>
    </main>
  );
}
