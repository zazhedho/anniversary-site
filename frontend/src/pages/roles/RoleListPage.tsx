import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { deleteRole, getRolesPage } from "../../services/rolesService";
import type { RoleRecord } from "../../types/role";

export default function RoleListPage() {
  const { hasAccess } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();

  const canCreateRole = hasAccess({ resource: "roles", action: "create" });
  const canUpdateRole = hasAccess({ resource: "roles", action: "update" });
  const canDeleteRole = hasAccess({ resource: "roles", action: "delete" });

  const [roles, setRoles] = useState<RoleRecord[]>([]);
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
    async function fetchRoles() {
      setLoading(true);
      setError("");
      try {
        const response = await getRolesPage({
          page,
          limit: 10,
          search,
          order_by: "name",
          order_direction: "asc",
        });
        setRoles(response.data || []);
        setTotalPages(response.total_pages || 1);
        setTotalData(response.total_data || 0);
      } catch (err) {
        const text = err instanceof Error ? err.message : t("roles.loadFailed");
        setError(text);
        notifyError(text);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [page, search, t, notifyError]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function onDelete(role: RoleRecord) {
    if (!canDeleteRole) return;
    if (role.is_system) {
      notifyError(t("roles.cannotDeleteSystem"));
      return;
    }

    const yes = window.confirm(t("roles.deleteConfirm", { name: role.display_name || role.name }));
    if (!yes) return;

    try {
      await deleteRole(role.id);
      notifySuccess(t("roles.deleted"));
      setRoles((prev) => prev.filter((item) => item.id !== role.id));
      setTotalData((prev) => Math.max(0, prev - 1));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : t("roles.deleteFailed"));
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("roles.tag")}</p>
            <h1 className="mt-1 font-display text-4xl leading-none">{t("roles.title")}</h1>
            <p className="mt-2 text-sm text-[#2b2220]/70">{t("roles.subtitle")}</p>
          </div>
          {canCreateRole ? (
            <Link to="/roles/new" className="rounded-xl bg-[#9c4f46] px-4 py-2 text-sm font-semibold text-white">
              {t("roles.add")}
            </Link>
          ) : (
            <span className="rounded-xl border border-[#9c4f46]/20 bg-white px-4 py-2 text-sm text-[#2b2220]/60">
              {t("roles.noCreatePermission")}
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
            placeholder={t("roles.searchPlaceholder")}
          />
          <button type="submit" className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white">
            {t("roles.search")}
          </button>
        </div>
      </form>

      {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
        {loading ? (
          <p className="text-sm text-[#2b2220]/70">{t("roles.loading")}</p>
        ) : roles.length === 0 ? (
          <p className="text-sm text-[#2b2220]/70">{t("roles.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#9c4f46]/15 text-[#6f332f]">
                  <th className="px-2 py-2 font-semibold">{t("roles.name")}</th>
                  <th className="px-2 py-2 font-semibold">{t("roles.displayName")}</th>
                  <th className="px-2 py-2 font-semibold">{t("roles.description")}</th>
                  <th className="px-2 py-2 font-semibold">{t("roles.type")}</th>
                  <th className="px-2 py-2 font-semibold">{t("roles.action")}</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-b border-[#9c4f46]/10">
                    <td className="px-2 py-2">{role.name}</td>
                    <td className="px-2 py-2">{role.display_name}</td>
                    <td className="px-2 py-2">{role.description || "-"}</td>
                    <td className="px-2 py-2">
                      {role.is_system ? (
                        <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">{t("roles.system")}</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">{t("roles.custom")}</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        {canUpdateRole ? (
                          <Link to={`/roles/${role.id}/edit`} className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold">
                            {t("roles.edit")}
                          </Link>
                        ) : (
                          <span className="text-xs text-[#2b2220]/50">{t("roles.noUpdatePermission")}</span>
                        )}
                        {canDeleteRole && !role.is_system ? (
                          <button
                            type="button"
                            onClick={() => onDelete(role)}
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                          >
                            {t("roles.delete")}
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
          <p className="text-xs text-[#2b2220]/70">{t("roles.totalPage", { total: totalData, page, totalPages })}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {t("roles.previous")}
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {t("roles.next")}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
