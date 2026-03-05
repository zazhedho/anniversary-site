import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { createMenu, getMenuById, getMenus, updateMenu } from "../../services/menusService";
import type { MenuCreatePayload, MenuRecord, MenuUpdatePayload } from "../../types/menu";

export default function MenuFormPage() {
  const { hasAccess } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);
  const canSubmit = isEdit ? hasAccess({ resource: "menus", action: "update" }) : hasAccess({ resource: "menus", action: "create" });

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [path, setPath] = useState("");
  const [icon, setIcon] = useState("");
  const [parentId, setParentId] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [allMenus, setAllMenus] = useState<MenuRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const title = useMemo(() => (isEdit ? t("menuForm.titleEdit") : t("menuForm.titleCreate")), [isEdit, t]);
  const availableParents = useMemo(() => allMenus.filter((menu) => menu.id !== id), [allMenus, id]);

  useEffect(() => {
    async function loadMenus() {
      try {
        const response = await getMenus({ page: 1, limit: 1000, order_by: "order_index", order_direction: "asc" });
        setAllMenus(response.data || []);
      } catch (err) {
        notifyError(err instanceof Error ? err.message : t("menuForm.loadFailed"));
      }
    }

    loadMenus();
  }, [notifyError, t]);

  useEffect(() => {
    if (!id) return;
    const menuId = id;

    async function loadDetail() {
      setFetching(true);
      setError("");
      try {
        const data = await getMenuById(menuId);
        setName(data.name || "");
        setDisplayName(data.display_name || "");
        setPath(data.path || "");
        setIcon(data.icon || "");
        setParentId(data.parent_id || "");
        setOrderIndex(data.order_index || 0);
        setIsActive(Boolean(data.is_active));
      } catch (err) {
        const text = err instanceof Error ? err.message : t("menuForm.loadFailed");
        setError(text);
        notifyError(text);
      } finally {
        setFetching(false);
      }
    }

    loadDetail();
  }, [id, notifyError, t]);

  function normalizeName(value: string) {
    return value.toLowerCase().replace(/\s+/g, "");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (isEdit && id) {
        const payload: MenuUpdatePayload = {
          display_name: displayName,
          path,
          icon,
          order_index: Number(orderIndex),
          is_active: isActive,
        };
        if (parentId) {
          payload.parent_id = parentId;
        }

        await updateMenu(id, payload);
        const text = t("menuForm.updateSuccess");
        setMessage(text);
        notifySuccess(text);
      } else {
        const payload: MenuCreatePayload = {
          name: normalizeName(name),
          display_name: displayName,
          path,
          icon,
          order_index: Number(orderIndex),
          is_active: isActive,
        };
        if (parentId) {
          payload.parent_id = parentId;
        }

        await createMenu(payload);
        const text = t("menuForm.createSuccess");
        setMessage(text);
        notifySuccess(text);
        navigate("/app/menus");
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : t("menuForm.saveFailed");
      setError(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("menuForm.tag")}</p>
        <h1 className="mt-2 font-display text-4xl leading-none">{title}</h1>
        <p className="mt-2 text-sm text-[#2b2220]/70">{t("menuForm.subtitle")}</p>
      </article>

      <form onSubmit={onSubmit} className="max-w-3xl space-y-3 rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        {fetching ? <p className="text-sm text-[#2b2220]/70">{t("menuForm.loading")}</p> : null}
        {!canSubmit ? <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">{t("userForm.noPermission")}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("menuForm.name")}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(normalizeName(event.target.value))}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              minLength={2}
              maxLength={50}
              disabled={isEdit || !canSubmit}
            />
            <p className="mt-1 text-xs text-[#2b2220]/60">{t("menuForm.nameHint")}</p>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("menuForm.displayName")}</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              minLength={2}
              maxLength={100}
              disabled={!canSubmit}
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("menuForm.path")}</span>
            <input
              type="text"
              value={path}
              onChange={(event) => setPath(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              maxLength={255}
              disabled={!canSubmit}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("menuForm.icon")}</span>
            <input
              type="text"
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              maxLength={50}
              placeholder="bi-speedometer2"
              disabled={!canSubmit}
            />
            <p className="mt-1 text-xs text-[#2b2220]/60">{t("menuForm.iconHint")}</p>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold">{t("menuForm.parent")}</span>
            <select
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              disabled={!canSubmit}
            >
              <option value="">{t("menuForm.parentNone")}</option>
              {availableParents.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.display_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("menuForm.order")}</span>
            <input
              type="number"
              value={orderIndex}
              onChange={(event) => setOrderIndex(Number(event.target.value))}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              min={0}
              disabled={!canSubmit}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            disabled={!canSubmit}
          />
          {t("menuForm.isActive")}
        </label>

        <div className="rounded-xl border border-[#9c4f46]/20 bg-white/70 p-3">
          <p className="text-xs uppercase tracking-[0.1em] text-[#6f332f]">{t("menuForm.preview")}</p>
          <p className="mt-1 text-sm font-semibold">{displayName || t("menuForm.displayName")}</p>
          <p className="text-xs text-[#2b2220]/65">{path || "/"}</p>
          {icon ? <p className="mt-1 text-xs text-[#2b2220]/65">{icon}</p> : null}
        </div>

        {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading || fetching || !canSubmit}
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
          >
            {loading ? t("menuForm.saving") : t("menuForm.save")}
          </button>
          <Link to="/app/menus" className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold">
            {t("menuForm.backToList")}
          </Link>
        </div>
      </form>
    </section>
  );
}
