import { FormEvent, useEffect, useState } from "react";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordValidationHint from "../../components/common/PasswordValidationHint";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { isPasswordValid, validatePassword } from "../../utils/passwordValidation";

function initialsFromName(value: string): string {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function ProfilePage() {
  const { user, updateCurrentUser, changeCurrentPassword, hasAccess } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
  const canUpdateProfile = hasAccess({ resource: "profile", action: "update" });
  const canUpdatePassword = hasAccess({ resource: "profile", action: "update_password" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const displayName = (user?.name || "-").trim() || "-";
  const displayEmail = (user?.email || "-").trim() || "-";
  const displayPhone = (user?.phone || "-").trim() || "-";
  const displayRole = (user?.role || "-").trim() || "-";
  const profileInitials = initialsFromName(displayName === "-" ? "User" : displayName);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
  }, [user]);

  async function onSubmitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setProfileSaving(true);

    try {
      await updateCurrentUser({ name, email, phone });
      const text = t("profile.saved");
      setProfileMessage(text);
      notifySuccess(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : t("profile.saveFailed");
      setProfileError(text);
      notifyError(text);
    } finally {
      setProfileSaving(false);
    }
  }

  async function onSubmitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    const validation = validatePassword(newPassword);
    if (!isPasswordValid(validation)) {
      const text = t("password.error.requirements");
      setPasswordError(text);
      notifyError(text);
      return;
    }

    if (newPassword !== confirmPassword) {
      const text = t("password.error.mismatch");
      setPasswordError(text);
      notifyError(text);
      return;
    }

    if (newPassword === currentPassword) {
      const text = t("changePassword.mustDifferent");
      setPasswordError(text);
      notifyError(text);
      return;
    }

    setPasswordSaving(true);
    try {
      await changeCurrentPassword({ current_password: currentPassword, new_password: newPassword });
      const text = t("changePassword.success");
      setPasswordMessage(text);
      notifySuccess(text);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const text = err instanceof Error ? err.message : t("changePassword.error");
      setPasswordError(text);
      notifyError(text);
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <article className="relative overflow-hidden rounded-3xl border border-[#9c4f46]/20 bg-[linear-gradient(130deg,rgba(255,255,255,0.92),rgba(252,231,224,0.88),rgba(246,214,202,0.88))] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.65),rgba(156,79,70,0.1))]" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.6),rgba(156,79,70,0.08))]" />

        <div className="relative">
          <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("profile.tag")}</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-4xl leading-none">{t("profile.title")}</h1>
              <p className="mt-2 text-sm text-[#2b2220]/70">{t("profile.subtitle")}</p>
            </div>
            <div className="inline-flex items-center gap-3 self-start rounded-2xl border border-[#9c4f46]/25 bg-white/70 px-3 py-2">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#9c4f46] to-[#6f332f] text-sm font-bold text-white">
                {profileInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2b2220]">{displayName}</p>
                <p className="text-xs text-[#2b2220]/65">{displayRole}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#9c4f46]/20 bg-white/75 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6f332f]/80">{t("common.name")}</p>
            <p className="text-sm font-semibold text-[#2b2220]">{displayName}</p>
          </div>
          <div className="rounded-2xl border border-[#9c4f46]/20 bg-white/75 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6f332f]/80">{t("common.email")}</p>
            <p className="truncate text-sm font-semibold text-[#2b2220]">{displayEmail}</p>
          </div>
          <div className="rounded-2xl border border-[#9c4f46]/20 bg-white/75 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6f332f]/80">{t("common.phone")}</p>
            <p className="text-sm font-semibold text-[#2b2220]">{displayPhone}</p>
          </div>
          <div className="rounded-2xl border border-[#9c4f46]/20 bg-white/75 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#6f332f]/80">{t("profile.roleLabel")}</p>
            <p className="text-sm font-semibold text-[#2b2220]">{displayRole}</p>
          </div>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={onSubmitProfile} className="space-y-3 rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
          <p className="text-sm font-semibold">{t("profile.save")}</p>
          {!canUpdateProfile ? <p className="text-sm text-amber-700">{t("profile.noUpdatePermission")}</p> : null}

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("common.name")}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              disabled={!canUpdateProfile}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("common.email")}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              disabled={!canUpdateProfile}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("common.phone")}</span>
            <input
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              disabled={!canUpdateProfile}
            />
          </label>

          {profileMessage ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{profileMessage}</p> : null}
          {profileError ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</p> : null}

          <button
            type="submit"
            disabled={profileSaving || !canUpdateProfile}
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
          >
            {profileSaving ? t("profile.saving") : t("profile.save")}
          </button>
        </form>

        <form onSubmit={onSubmitPassword} className="space-y-3 rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
          <p className="text-sm font-semibold">{t("changePassword.title")}</p>
          <p className="text-sm text-[#2b2220]/70">{t("changePassword.subtitle")}</p>
          {!canUpdatePassword ? <p className="text-sm text-amber-700">{t("profile.noPasswordPermission")}</p> : null}

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("changePassword.current")}</span>
            <PasswordInput
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              disabled={!canUpdatePassword}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("changePassword.new")}</span>
            <PasswordInput
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              disabled={!canUpdatePassword}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("changePassword.confirm")}</span>
            <PasswordInput
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              disabled={!canUpdatePassword}
            />
          </label>

          <PasswordValidationHint password={newPassword} confirmPassword={confirmPassword} showMatchHint />
          {passwordMessage ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{passwordMessage}</p> : null}
          {passwordError ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p> : null}

          <button
            type="submit"
            disabled={passwordSaving || !canUpdatePassword}
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
          >
            {passwordSaving ? t("changePassword.updating") : t("changePassword.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}
