import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { deleteMenu, getMenus, updateMenu } from "../../services/menusService";
import type { MenuRecord } from "../../types/menu";

export default function MenuListPage() {
  const { hasAccess } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();

  const canCreateMenu = hasAccess({ resource: "menus", action: "create" });
  const canUpdateMenu = hasAccess({ resource: "menus", action: "update" });
  const canDeleteMenu = hasAccess({ resource: "menus", action: "delete" });

  const [menus, setMenus] = useState<MenuRecord[]>([]);
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
    async function fetchMenus() {
      setLoading(true);
      setError("");
      try {
        const response = await getMenus({
          page,
          limit: 10,
          search,
          order_by: "order_index",
          order_direction: "asc",
        });

        setMenus(response.data || []);
        setTotalPages(response.total_pages || 1);
        setTotalData(response.total_data || 0);
      } catch (err) {
        const text = err instanceof Error ? err.message : t("menus.loadFailed");
        setError(text);
        notifyError(text);
      } finally {
        setLoading(false);
      }
    }

    fetchMenus();
  }, [page, search, t, notifyError]);

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function onDelete(menu: MenuRecord) {
    if (!canDeleteMenu) return;
    const yes = window.confirm(t("menus.deleteConfirm", { name: menu.display_name || menu.name }));
    if (!yes) return;

    try {
      await deleteMenu(menu.id);
      notifySuccess(t("menus.deleted"));
      setMenus((prev) => prev.filter((item) => item.id !== menu.id));
      setTotalData((prev) => Math.max(0, prev - 1));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : t("menus.deleteFailed"));
    }
  }

  async function onToggleStatus(menu: MenuRecord) {
    if (!canUpdateMenu) return;
    try {
      await updateMenu(menu.id, { is_active: !menu.is_active });
      setMenus((prev) => prev.map((item) => (item.id === menu.id ? { ...item, is_active: !item.is_active } : item)));
      notifySuccess(t("menus.toggleStatusSuccess"));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : t("menus.toggleStatusFailed"));
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("menus.tag")}</p>
            <h1 className="mt-1 font-display text-4xl leading-none">{t("menus.title")}</h1>
            <p className="mt-2 text-sm text-[#2b2220]/70">{t("menus.subtitle")}</p>
          </div>
          {canCreateMenu ? (
            <Link to="/menus/new" className="rounded-xl bg-[#9c4f46] px-4 py-2 text-sm font-semibold text-white">
              {t("menus.add")}
            </Link>
          ) : (
            <span className="rounded-xl border border-[#9c4f46]/20 bg-white px-4 py-2 text-sm text-[#2b2220]/60">
              {t("menus.noCreatePermission")}
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
            placeholder={t("menus.searchPlaceholder")}
          />
          <button type="submit" className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white">
            {t("menus.search")}
          </button>
        </div>
      </form>

      {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
        {loading ? (
          <p className="text-sm text-[#2b2220]/70">{t("menus.loading")}</p>
        ) : menus.length === 0 ? (
          <p className="text-sm text-[#2b2220]/70">{t("menus.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#9c4f46]/15 text-[#6f332f]">
                  <th className="px-2 py-2 font-semibold">{t("menus.order")}</th>
                  <th className="px-2 py-2 font-semibold">{t("menus.icon")}</th>
                  <th className="px-2 py-2 font-semibold">{t("menus.name")}</th>
                  <th className="px-2 py-2 font-semibold">{t("menus.displayName")}</th>
                  <th className="px-2 py-2 font-semibold">{t("menus.path")}</th>
                  <th className="px-2 py-2 font-semibold">{t("menus.status")}</th>
                  <th className="px-2 py-2 font-semibold">{t("menus.action")}</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <tr key={menu.id} className="border-b border-[#9c4f46]/10">
                    <td className="px-2 py-2">{menu.order_index}</td>
                    <td className="px-2 py-2">
                      {menu.icon ? <span className="inline-flex rounded-lg border border-[#9c4f46]/20 bg-white px-2 py-1 text-xs">{menu.icon}</span> : "-"}
                    </td>
                    <td className="px-2 py-2">{menu.name}</td>
                    <td className="px-2 py-2">{menu.display_name}</td>
                    <td className="px-2 py-2">{menu.path}</td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(menu)}
                        disabled={!canUpdateMenu}
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                          menu.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
                        } disabled:opacity-60`}
                      >
                        {menu.is_active ? t("menus.active") : t("menus.inactive")}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        {canUpdateMenu ? (
                          <Link to={`/menus/${menu.id}/edit`} className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold">
                            {t("menus.edit")}
                          </Link>
                        ) : (
                          <span className="text-xs text-[#2b2220]/50">{t("menus.noUpdatePermission")}</span>
                        )}
                        {canDeleteMenu ? (
                          <button
                            type="button"
                            onClick={() => onDelete(menu)}
                            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                          >
                            {t("menus.delete")}
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
          <p className="text-xs text-[#2b2220]/70">{t("menus.totalPage", { total: totalData, page, totalPages })}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {t("menus.previous")}
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {t("menus.next")}
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
