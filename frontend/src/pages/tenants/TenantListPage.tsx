import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { deleteTenant, getTenantsPage } from "../../services/tenantsService";
import type { TenantRecord } from "../../types/tenant";

export default function TenantListPage() {
  const { hasAccess, refreshTenants } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();

  const canCreateTenant = hasAccess({ resource: "tenants", action: "create" });
  const canUpdateTenant = hasAccess({ resource: "tenants", action: "update" });
  const canDeleteTenant = hasAccess({ resource: "tenants", action: "delete" });

  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page < totalPages, [page, totalPages]);

  useEffect(() => {
    async function fetchTenants() {
      setLoading(true);
      setError("");
      try {
        const response = await getTenantsPage({
          page,
          limit: 10,
          search,
          order_by: "created_at",
          order_direction: "desc",
        });
        setTenants(response.data || []);
        setTotalPages(response.total_pages || 1);
        setTotalData(response.total_data || 0);
      } catch (err) {
        const text = err instanceof Error ? err.message : t("tenantList.loadFailed");
        setError(text);
        notifyError(text);
      } finally {
        setLoading(false);
      }
    }

    fetchTenants();
  }, [page, search, t, notifyError]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function onDelete(tenant: TenantRecord) {
    if (!canDeleteTenant) return;
    const yes = window.confirm(t("tenantList.deleteConfirm", { name: tenant.name }));
    if (!yes) return;

    try {
      await deleteTenant(tenant.id);
      notifySuccess(t("tenantList.deleted"));
      await refreshTenants();
      setTenants((prev) => prev.filter((item) => item.id !== tenant.id));
      setTotalData((prev) => Math.max(0, prev - 1));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : t("tenantList.deleteFailed"));
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("tenantList.tag")}</p>
            <h1 className="mt-1 font-display text-4xl leading-none">{t("tenantList.title")}</h1>
            <p className="mt-2 text-sm text-[#2b2220]/70">{t("tenantList.subtitle")}</p>
          </div>
          {canCreateTenant ? (
            <Link to="/app/tenants/new" className="rounded-xl bg-[#9c4f46] px-4 py-2 text-sm font-semibold text-white">
              {t("tenantList.add")}
            </Link>
          ) : (
            <span className="rounded-xl border border-[#9c4f46]/20 bg-white px-4 py-2 text-sm text-[#2b2220]/60">
              {t("tenantList.noCreatePermission")}
            </span>
          )}
        </div>
      </article>

      <form onSubmit={onSearch} className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            placeholder={t("tenantList.searchPlaceholder")}
          />
          <button type="submit" className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white">
            {t("tenantList.search")}
          </button>
        </div>
      </form>

      {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
        {loading ? (
          <p className="text-sm text-[#2b2220]/70">{t("tenantList.loading")}</p>
        ) : tenants.length === 0 ? (
          <p className="text-sm text-[#2b2220]/70">{t("tenantList.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#9c4f46]/15 text-[#6f332f]">
                  <th className="px-2 py-2 font-semibold">{t("tenantList.slug")}</th>
                  <th className="px-2 py-2 font-semibold">{t("tenantList.name")}</th>
                  <th className="px-2 py-2 font-semibold">{t("tenantList.status")}</th>
                  <th className="px-2 py-2 font-semibold">{t("tenantList.members")}</th>
                  <th className="px-2 py-2 font-semibold">{t("tenantList.action")}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-[#9c4f46]/10">
                    <td className="px-2 py-2 font-semibold">{tenant.slug}</td>
                    <td className="px-2 py-2">{tenant.name}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          tenant.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-2 py-2">{tenant.member_count || 0}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        {canUpdateTenant ? (
                          <Link to={`/app/tenants/${tenant.id}/edit`} className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold">
                            {t("tenantList.edit")}
                          </Link>
                        ) : (
                          <span className="text-xs text-[#2b2220]/50">{t("tenantList.noUpdatePermission")}</span>
                        )}
                        {canDeleteTenant ? (
                          <button
                            type="button"
                            onClick={() => onDelete(tenant)}
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                          >
                            {t("tenantList.delete")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#2b2220]/70">{t("tenantList.totalPage", { total: totalData, page, totalPages })}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {t("tenantList.previous")}
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {t("tenantList.next")}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
