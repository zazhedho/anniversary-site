import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { getRoles } from "../../services/rolesService";
import { getUsers } from "../../services/usersService";
import type { RoleRecord } from "../../types/role";
import type { UserRecord } from "../../types/user";

export default function UserListPage() {
  const { hasAccess } = useAuth();
  const { t } = useLanguage();
  const { notifyError } = useNotification();
  const canCreateUser = hasAccess({ resource: "users", action: "create" });
  const canUpdateUser = hasAccess({ resource: "users", action: "update" });

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleError, setRoleError] = useState("");

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page < totalPages, [page, totalPages]);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const data = await getRoles({
          page: 1,
          limit: 1000,
          order_by: "name",
          order_direction: "asc",
        });
        setRoles(data);
      } catch (err) {
        const text = err instanceof Error ? err.message : t("userList.roleLoadFailed");
        setRoleError(text);
        notifyError(text);
      }
    }

    fetchRoles();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError("");

      try {
        const response = await getUsers({
          page,
          limit: 10,
          search,
          role,
          order_by: "updated_at",
          order_direction: "desc",
        });

        setUsers(response.data || []);
        setTotalPages(response.total_pages || 1);
        setTotalData(response.total_data || 0);
      } catch (err) {
        const text = err instanceof Error ? err.message : t("userList.loadFailed");
        setError(text);
        notifyError(text);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [page, role, search]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("userList.tag")}</p>
            <h1 className="mt-1 font-display text-4xl leading-none">{t("userList.title")}</h1>
            <p className="mt-2 text-sm text-[#2b2220]/70">
              {t("userList.subtitle")}
            </p>
          </div>
          {canCreateUser ? (
            <Link to="/app/users/new" className="rounded-xl bg-[#9c4f46] px-4 py-2 text-sm font-semibold text-white">
              {t("userList.addUser")}
            </Link>
          ) : (
            <span className="rounded-xl border border-[#9c4f46]/20 bg-white px-4 py-2 text-sm text-[#2b2220]/60">
              {t("userList.noCreatePermission")}
            </span>
          )}
        </div>
      </article>

      <form onSubmit={onSearch} className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            placeholder={t("userList.searchPlaceholder")}
          />

          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
          >
            <option value="">{t("userList.allRoles")}</option>
            {roles.map((item) => (
              <option key={item.id} value={item.name}>
                {item.display_name || item.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {t("userList.search")}
          </button>
        </div>
      </form>

      {roleError ? <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">{roleError}</p> : null}
      {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
        {loading ? (
          <p className="text-sm text-[#2b2220]/70">{t("userList.loadingUsers")}</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-[#2b2220]/70">{t("userList.noUsers")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#9c4f46]/15 text-[#6f332f]">
                  <th className="px-2 py-2 font-semibold">{t("userList.name")}</th>
                  <th className="px-2 py-2 font-semibold">{t("userList.email")}</th>
                  <th className="px-2 py-2 font-semibold">{t("userList.phone")}</th>
                  <th className="px-2 py-2 font-semibold">{t("userList.role")}</th>
                  <th className="px-2 py-2 font-semibold">{t("userList.action")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id} className="border-b border-[#9c4f46]/10">
                    <td className="px-2 py-2">{item.name}</td>
                    <td className="px-2 py-2">{item.email}</td>
                    <td className="px-2 py-2">{item.phone || "-"}</td>
                    <td className="px-2 py-2">{item.role || "-"}</td>
                    <td className="px-2 py-2">
                      {canUpdateUser ? (
                        <Link
                          to={`/app/users/${item.id}/edit`}
                          className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold"
                        >
                          {t("userList.edit")}
                        </Link>
                      ) : (
                        <span className="text-xs text-[#2b2220]/50">{t("userList.noUpdatePermission")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#2b2220]/70">
            {t("userList.totalPage", { total: totalData, page, totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {t("userList.previous")}
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {t("userList.next")}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
