import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { getMenus } from "../../services/menusService";
import { getPermissions } from "../../services/permissionsService";
import {
  assignRoleMenus,
  assignRolePermissions,
  createRole,
  getRoleById,
  updateRole,
} from "../../services/rolesService";
import type { MenuRecord } from "../../types/menu";
import type { PermissionGrant } from "../../types/permission";

export default function RoleFormPage() {
  const { hasAccess } = useAuth();
  const { t } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();
  const { id } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(id);
  const canCreateRole = hasAccess({ resource: "roles", action: "create" });
  const canUpdateRole = hasAccess({ resource: "roles", action: "update" });
  const canAssignPermissions = hasAccess({ resource: "roles", action: "assign_permissions" });
  const canAssignMenus = hasAccess({ resource: "roles", action: "assign_menus" });
  const canSubmit = isEdit
    ? canUpdateRole || canAssignPermissions || canAssignMenus
    : canCreateRole && canAssignPermissions && canAssignMenus;

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [permissions, setPermissions] = useState<PermissionGrant[]>([]);
  const [menus, setMenus] = useState<MenuRecord[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const title = useMemo(() => (isEdit ? t("roleForm.titleEdit") : t("roleForm.titleCreate")), [isEdit, t]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, PermissionGrant[]>>((acc, item) => {
      const key = item.resource || "general";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [permissions]);

  const allPermissionIds = useMemo(() => permissions.map((item) => item.id), [permissions]);
  const allMenuIds = useMemo(() => menus.map((item) => item.id), [menus]);

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [permissionData, menuRes] = await Promise.all([
          getPermissions({ page: 1, limit: 1000, order_by: "resource", order_direction: "asc" }),
          getMenus({ page: 1, limit: 1000, order_by: "order_index", order_direction: "asc" }),
        ]);
        setPermissions(permissionData);
        setMenus(menuRes.data || []);
      } catch (err) {
        notifyError(err instanceof Error ? err.message : t("roleForm.loadFailed"));
      }
    }

    loadMasterData();
  }, [notifyError, t]);

  useEffect(() => {
    if (!id) return;
    const roleId = id;

    async function loadRole() {
      setFetching(true);
      setError("");
      try {
        const role = await getRoleById(roleId);
        setName(role.name || "");
        setDisplayName(role.display_name || "");
        setDescription(role.description || "");
        setIsSystemRole(Boolean(role.is_system));
        setSelectedPermissions(role.permission_ids || []);
        setSelectedMenus(role.menu_ids || []);
      } catch (err) {
        const text = err instanceof Error ? err.message : t("roleForm.loadFailed");
        setError(text);
        notifyError(text);
      } finally {
        setFetching(false);
      }
    }

    loadRole();
  }, [id, notifyError, t]);

  function normalizeName(value: string) {
    return value.toLowerCase().replace(/\s+/g, "");
  }

  function toggleSelection(idValue: string, selected: string[], setSelected: (values: string[]) => void) {
    if (selected.includes(idValue)) {
      setSelected(selected.filter((value) => value !== idValue));
      return;
    }
    setSelected([...selected, idValue]);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (selectedPermissions.length === 0) {
        const text = t("roleForm.minPermissions");
        setError(text);
        notifyError(text);
        setLoading(false);
        return;
      }
      if (selectedMenus.length === 0) {
        const text = t("roleForm.minMenus");
        setError(text);
        notifyError(text);
        setLoading(false);
        return;
      }

      if (isEdit && id) {
        if (!isSystemRole && canUpdateRole) {
          await updateRole(id, { display_name: displayName, description });
        }
        if (canAssignPermissions) {
          await assignRolePermissions(id, { permission_ids: selectedPermissions });
        }
        if (canAssignMenus) {
          await assignRoleMenus(id, { menu_ids: selectedMenus });
        }
        const text = t("roleForm.updateSuccess");
        setMessage(text);
        notifySuccess(text);
      } else {
        if (!canCreateRole || !canAssignPermissions || !canAssignMenus) {
          const text = t("roleForm.noPermissionToAssign");
          setError(text);
          notifyError(text);
          setLoading(false);
          return;
        }
        const createdRole = await createRole({
          name: normalizeName(name),
          display_name: displayName,
          description,
        });
        await assignRolePermissions(createdRole.id, { permission_ids: selectedPermissions });
        await assignRoleMenus(createdRole.id, { menu_ids: selectedMenus });
        const text = t("roleForm.createSuccess");
        setMessage(text);
        notifySuccess(text);
        navigate("/roles");
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : t("roleForm.saveFailed");
      setError(text);
      notifyError(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("roleForm.tag")}</p>
        <h1 className="mt-2 font-display text-4xl leading-none">{title}</h1>
        <p className="mt-2 text-sm text-[#2b2220]/70">{t("roleForm.subtitle")}</p>
      </article>

      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        {fetching ? <p className="text-sm text-[#2b2220]/70">{t("roleForm.loading")}</p> : null}
        {!canSubmit ? <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">{t("userForm.noPermission")}</p> : null}
        {isSystemRole ? <p className="rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-800">{t("roleForm.systemRoleLocked")}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("roleForm.name")}</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(normalizeName(event.target.value))}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              minLength={3}
              maxLength={50}
              disabled={isEdit || isSystemRole || !canSubmit}
            />
            <p className="mt-1 text-xs text-[#2b2220]/60">{t("roleForm.nameHint")}</p>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t("roleForm.displayName")}</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              minLength={3}
              maxLength={100}
              disabled={isSystemRole || !canSubmit}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("roleForm.description")}</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="min-h-[90px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            maxLength={500}
            disabled={isSystemRole || !canSubmit}
          />
        </label>

        <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">{t("roleForm.permissions")}</p>
            <button
              type="button"
              onClick={() => setSelectedPermissions(selectedPermissions.length === allPermissionIds.length ? [] : allPermissionIds)}
              disabled={!canAssignPermissions || !canSubmit}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              {selectedPermissions.length === allPermissionIds.length ? t("roleForm.deselectAll") : t("roleForm.selectAll")}
            </button>
          </div>

          <div className="grid gap-3">
            {Object.entries(groupedPermissions).map(([resource, items]) => (
              <div key={resource} className="rounded-xl border border-[#9c4f46]/15 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#6f332f]">{resource}</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => toggleSelection(permission.id, selectedPermissions, setSelectedPermissions)}
                        disabled={!canAssignPermissions || !canSubmit}
                      />
                      <span>{permission.display_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/70 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">{t("roleForm.menus")}</p>
            <button
              type="button"
              onClick={() => setSelectedMenus(selectedMenus.length === allMenuIds.length ? [] : allMenuIds)}
              disabled={!canAssignMenus || !canSubmit}
              className="rounded-lg border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
            >
              {selectedMenus.length === allMenuIds.length ? t("roleForm.deselectAll") : t("roleForm.selectAll")}
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => (
              <label key={menu.id} className="flex items-center gap-2 rounded-lg border border-[#9c4f46]/10 bg-white px-2 py-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={selectedMenus.includes(menu.id)}
                  onChange={() => toggleSelection(menu.id, selectedMenus, setSelectedMenus)}
                  disabled={!canAssignMenus || !canSubmit}
                />
                <span>{menu.display_name}</span>
              </label>
            ))}
          </div>
        </article>

        {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading || fetching || !canSubmit}
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
          >
            {loading ? t("roleForm.saving") : t("roleForm.save")}
          </button>
          <Link to="/roles" className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold">
            {t("roleForm.backToList")}
          </Link>
        </div>
      </form>
    </section>
  );
}
