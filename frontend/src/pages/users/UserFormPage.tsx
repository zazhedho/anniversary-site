import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordValidationHint from "../../components/common/PasswordValidationHint";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { getRoles } from "../../services/rolesService";
import type { RoleRecord } from "../../types/role";
import { createUser, getUserById, updateUserById } from "../../services/usersService";
import { isPasswordValid, validatePassword } from "../../utils/passwordValidation";

export default function UserFormPage() {
  const { hasAccess } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const canSubmit = isEdit
    ? hasAccess({ resource: "users", action: "update" })
    : hasAccess({ resource: "users", action: "create" });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roles, setRoles] = useState<RoleRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [roleError, setRoleError] = useState("");

  const title = useMemo(() => (isEdit ? t("userForm.titleEdit") : t("userForm.titleCreate")), [isEdit, t]);
  const roleOptions = useMemo(() => {
    if (!role) return roles;
    const exists = roles.some((item) => item.name === role);
    if (exists) return roles;
    return [
      ...roles,
      {
        id: `manual-${role}`,
        name: role,
        display_name: role,
      },
    ];
  }, [roles, role]);

  useEffect(() => {
    async function fetchRoles() {
      setLoadingRoles(true);
      try {
        const data = await getRoles({
          page: 1,
          limit: 1000,
          order_by: "name",
          order_direction: "asc",
        });
        setRoles(data);
        setRole((prev) => prev || data[0]?.name || "");
      } catch (err) {
        const text = err instanceof Error ? err.message : t("userForm.roleLoadFailed");
        setRoleError(text);
        notifyError(text);
      } finally {
        setLoadingRoles(false);
      }
    }

    fetchRoles();
  }, []);

  useEffect(() => {
    if (!id) return;
    const userId = id;

    async function fetchDetail() {
      setFetching(true);
      setError("");
      try {
        const user = await getUserById(userId);
        setName(user.name || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setRole(user.role || "viewer");
      } catch (err) {
        const text = err instanceof Error ? err.message : t("userForm.detailFailed");
        setError(text);
        notifyError(text);
      } finally {
        setFetching(false);
      }
    }

    fetchDetail();
  }, [id]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (isEdit && id) {
        await updateUserById(id, { name, email, phone, role });
        const text = t("userForm.updateSuccess");
        setMessage(text);
        notifySuccess(text);
      } else {
        const validation = validatePassword(password);
        if (!isPasswordValid(validation)) {
          const text = t("password.error.requirements");
          setError(text);
          notifyError(text);
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          const text = t("password.error.mismatch");
          setError(text);
          notifyError(text);
          setLoading(false);
          return;
        }

        await createUser({ name, email, phone, role, password });
        const text = t("userForm.createSuccess");
        setMessage(text);
        notifySuccess(text);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : t("userForm.saveFailed");
      setError(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("userForm.tag")}</p>
        <h1 className="mt-2 font-display text-4xl leading-none">{title}</h1>
        <p className="mt-2 text-sm text-[#2b2220]/70">{t("userForm.subtitle")}</p>
      </article>

      <form onSubmit={onSubmit} className="max-w-2xl rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5 space-y-3">
        {fetching ? <p className="text-sm text-[#2b2220]/70">{t("userForm.loadingDetail")}</p> : null}
        {!canSubmit ? (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {t("userForm.noPermission")}
          </p>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("common.name")}</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
            minLength={3}
            disabled={!canSubmit}
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
            disabled={!canSubmit}
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
            minLength={9}
            disabled={!canSubmit}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("userList.role")}</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
            disabled={loadingRoles || !canSubmit}
          >
            {roleOptions.map((item) => (
              <option key={item.id} value={item.name}>
                {item.display_name || item.name}
              </option>
            ))}
          </select>
        </label>

        {roleError ? <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">{roleError}</p> : null}

        {!isEdit ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t("common.password")}</span>
              <PasswordInput
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
                required
                minLength={8}
                disabled={!canSubmit}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t("common.confirmPassword")}</span>
              <PasswordInput
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
                required
                minLength={8}
                disabled={!canSubmit}
              />
            </label>
            <PasswordValidationHint password={password} confirmPassword={confirmPassword} showMatchHint />
          </>
        ) : null}

        {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading || fetching || loadingRoles || !role || !canSubmit}
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
          >
            {loading ? t("userForm.saving") : t("userForm.saveUser")}
          </button>
          <Link
            to="/app/users"
            className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            {t("userForm.backToList")}
          </Link>
          {message ? (
            <button
              type="button"
              className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold"
              onClick={() => navigate("/app/users")}
            >
              {t("userForm.goToUsers")}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
