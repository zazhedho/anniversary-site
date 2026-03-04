import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { addTenantMember, createTenant, getTenantById, updateTenant } from "../../services/tenantsService";
import { normalizeTenantSlug } from "../../utils/tenantSlug";
import type { TenantMemberRecord } from "../../types/tenant";

export default function TenantFormPage() {
  const { hasAccess, refreshTenants } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);
  const canCreateTenant = hasAccess({ resource: "tenants", action: "create" });
  const canUpdateTenant = hasAccess({ resource: "tenants", action: "update" });
  const canAccessAllTenants = hasAccess({ resource: "tenants", action: "access_all" });
  const canSubmit = isEdit ? canUpdateTenant : canCreateTenant;
  const canEditSlug = !isEdit || canAccessAllTenants;

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"active" | "suspended">("active");
  const [members, setMembers] = useState<TenantMemberRecord[]>([]);
  const [memberUserID, setMemberUserID] = useState("");
  const [memberType, setMemberType] = useState<"owner" | "member">("member");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [savingMember, setSavingMember] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const title = useMemo(() => (isEdit ? t("tenantForm.titleEdit") : t("tenantForm.titleCreate")), [isEdit, t]);

  useEffect(() => {
    if (!id) return;
    const tenantID = id;

    async function loadDetail() {
      setFetching(true);
      setError("");
      try {
        const detail = await getTenantById(tenantID);
        setSlug(detail.tenant.slug || "");
        setName(detail.tenant.name || "");
        setStatus(detail.tenant.status === "suspended" ? "suspended" : "active");
        setMembers(detail.members || []);
      } catch (err) {
        const text = err instanceof Error ? err.message : t("tenantForm.loadFailed");
        setError(text);
        notifyError(text);
      } finally {
        setFetching(false);
      }
    }

    loadDetail();
  }, [id, notifyError, t]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (isEdit && id) {
        const payload = {
          name: name.trim(),
          status,
        } as { slug?: string; name: string; status: "active" | "suspended" };
        if (canEditSlug) {
          payload.slug = normalizeTenantSlug(slug);
        }

        const detail = await updateTenant(id, payload);
        setMembers(detail.members || []);
        const text = t("tenantForm.updateSuccess");
        setMessage(text);
        notifySuccess(text);
      } else {
        await createTenant({
          slug: normalizeTenantSlug(slug),
          name: name.trim(),
          status,
        });
        const text = t("tenantForm.createSuccess");
        setMessage(text);
        notifySuccess(text);
        await refreshTenants();
        navigate("/app/tenants");
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : t("tenantForm.saveFailed");
      setError(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  async function onAddMember() {
    if (!id) return;
    if (!memberUserID.trim()) {
      const text = t("tenantForm.memberUserIdRequired");
      setError(text);
      notifyError(text);
      return;
    }

    setSavingMember(true);
    setError("");
    setMessage("");
    try {
      const nextMembers = await addTenantMember(id, {
        user_id: memberUserID.trim(),
        member_type: memberType,
      });
      setMembers(nextMembers as TenantMemberRecord[]);
      setMemberUserID("");
      const text = t("tenantForm.memberSaved");
      setMessage(text);
      notifySuccess(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : t("tenantForm.memberSaveFailed");
      setError(text);
      notifyError(text);
    } finally {
      setSavingMember(false);
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("tenantForm.tag")}</p>
        <h1 className="mt-2 font-display text-4xl leading-none">{title}</h1>
        <p className="mt-2 text-sm text-[#2b2220]/70">{t("tenantForm.subtitle")}</p>
      </article>

      <form onSubmit={onSubmit} className="max-w-3xl space-y-3 rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        {fetching ? <p className="text-sm text-[#2b2220]/70">{t("tenantForm.loading")}</p> : null}
        {!canSubmit ? <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">{t("tenantForm.noPermission")}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("tenantForm.slug")}</span>
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(normalizeTenantSlug(event.target.value))}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              placeholder={t("tenantForm.slugPlaceholder")}
              required
              minLength={3}
              maxLength={100}
              disabled={!canSubmit || !canEditSlug}
            />
            {isEdit && !canEditSlug ? <p className="mt-1 text-xs text-[#2b2220]/60">{t("tenantForm.slugLockedHint")}</p> : null}
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("tenantForm.name")}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              placeholder={t("tenantForm.namePlaceholder")}
              required
              minLength={3}
              maxLength={150}
              disabled={!canSubmit}
            />
          </label>
        </div>

        <label className="block max-w-xs">
          <span className="mb-1 block text-sm font-semibold">{t("tenantForm.status")}</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value === "suspended" ? "suspended" : "active")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            disabled={!canSubmit}
          >
            <option value="active">{t("tenantForm.statusActive")}</option>
            <option value="suspended">{t("tenantForm.statusSuspended")}</option>
          </select>
        </label>

        {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading || fetching || !canSubmit}
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
          >
            {loading ? t("tenantForm.saving") : t("tenantForm.save")}
          </button>
          <Link to="/app/tenants" className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold">
            {t("tenantForm.backToList")}
          </Link>
        </div>
      </form>

      {isEdit ? (
        <article className="space-y-3 rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#2b2220]">{t("tenantForm.membersTitle")}</h2>
            <p className="text-sm text-[#2b2220]/70">{t("tenantForm.membersSubtitle")}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t("tenantForm.memberUserId")}</span>
              <input
                type="text"
                value={memberUserID}
                onChange={(event) => setMemberUserID(event.target.value)}
                className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
                placeholder={t("tenantForm.memberUserIdPlaceholder")}
                disabled={!canUpdateTenant}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t("tenantForm.memberType")}</span>
              <select
                value={memberType}
                onChange={(event) => setMemberType(event.target.value === "owner" ? "owner" : "member")}
                className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
                disabled={!canUpdateTenant}
              >
                <option value="member">{t("tenantForm.memberTypeMember")}</option>
                <option value="owner">{t("tenantForm.memberTypeOwner")}</option>
              </select>
            </label>

            <button
              type="button"
              onClick={onAddMember}
              disabled={!canUpdateTenant || savingMember}
              className="rounded-xl bg-[#9c4f46] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingMember ? t("tenantForm.memberSaving") : t("tenantForm.memberAdd")}
            </button>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-[#2b2220]/70">{t("tenantForm.membersEmpty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#9c4f46]/15 text-[#6f332f]">
                    <th className="px-2 py-2 font-semibold">{t("tenantForm.memberName")}</th>
                    <th className="px-2 py-2 font-semibold">{t("tenantForm.memberEmail")}</th>
                    <th className="px-2 py-2 font-semibold">{t("tenantForm.memberUserId")}</th>
                    <th className="px-2 py-2 font-semibold">{t("tenantForm.memberType")}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-[#9c4f46]/10">
                      <td className="px-2 py-2">{member.user_name || "-"}</td>
                      <td className="px-2 py-2">{member.user_email || "-"}</td>
                      <td className="px-2 py-2">{member.user_id}</td>
                      <td className="px-2 py-2">{member.member_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      ) : null}
    </section>
  );
}
