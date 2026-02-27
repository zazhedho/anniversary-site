import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../../components/common/AuthCard";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
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
      const text = t("forgot.success");
      setMessage(text);
      notifySuccess(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : t("forgot.error");
      setError(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-10 text-[#2b2220]">
      <AuthCard title={t("forgot.title")} subtitle={t("forgot.subtitle")}>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm" placeholder={t("common.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white">
            {loading ? t("forgot.sending") : t("forgot.submit")}
          </button>

          <p className="text-sm text-[#2b2220]/70">
            {t("forgot.remember")} <Link to="/login" className="font-semibold text-[#6f332f]">{t("login.submit")}</Link>
          </p>
        </form>
      </AuthCard>
    </main>
  );
}
