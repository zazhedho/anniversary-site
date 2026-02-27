import { FormEvent, useState } from "react";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordValidationHint from "../../components/common/PasswordValidationHint";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { isPasswordValid, validatePassword } from "../../utils/passwordValidation";

export default function ChangePasswordPage() {
  const { changeCurrentPassword } = useAuth();
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const validation = validatePassword(newPassword);
    if (!isPasswordValid(validation)) {
      setError(t("password.error.requirements"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("password.error.mismatch"));
      return;
    }

    if (newPassword === currentPassword) {
      setError(t("changePassword.mustDifferent"));
      return;
    }

    setSaving(true);
    try {
      await changeCurrentPassword({ current_password: currentPassword, new_password: newPassword });
      setMessage(t("changePassword.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("changePassword.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5 max-w-xl">
      <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("changePassword.tag")}</p>
      <h1 className="mt-2 font-display text-4xl leading-none">{t("changePassword.title")}</h1>
      <p className="mt-2 text-sm text-[#2b2220]/70">{t("changePassword.subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("changePassword.current")}</span>
          <PasswordInput
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("changePassword.new")}</span>
          <PasswordInput
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("changePassword.confirm")}</span>
          <PasswordInput
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>
        <PasswordValidationHint password={newPassword} confirmPassword={confirmPassword} showMatchHint />

        {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
        >
          {saving ? t("changePassword.updating") : t("changePassword.submit")}
        </button>
      </form>
    </section>
  );
}
