import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getRoles } from "../../services/rolesService";
import type { RoleRecord } from "../../types/role";
import { createUser, getUserById, updateUserById } from "../../services/usersService";

export default function UserFormPage() {
  const { hasAccess } = useAuth();
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
  const [roles, setRoles] = useState<RoleRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [roleError, setRoleError] = useState("");

  const title = useMemo(() => (isEdit ? "Edit User" : "Create User"), [isEdit]);
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
        setRoleError(err instanceof Error ? err.message : "Gagal memuat opsi role");
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
        setError(err instanceof Error ? err.message : "Gagal mengambil detail user");
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
        setMessage("User berhasil diperbarui.");
      } else {
        await createUser({ name, email, phone, role, password });
        setMessage("User berhasil dibuat.");
        setPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">Users</p>
        <h1 className="mt-2 font-display text-4xl leading-none">{title}</h1>
        <p className="mt-2 text-sm text-[#2b2220]/70">Lengkapi data akun dan peran yang dibutuhkan.</p>
      </article>

      <form onSubmit={onSubmit} className="max-w-2xl rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5 space-y-3">
        {fetching ? <p className="text-sm text-[#2b2220]/70">Loading detail user...</p> : null}
        {!canSubmit ? (
          <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Kamu tidak punya permission untuk aksi ini.
          </p>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Name</span>
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
          <span className="mb-1 block text-sm font-semibold">Email</span>
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
          <span className="mb-1 block text-sm font-semibold">Phone</span>
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
          <span className="mb-1 block text-sm font-semibold">Role</span>
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
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
              required
              minLength={8}
              disabled={!canSubmit}
            />
          </label>
        ) : null}

        {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading || fetching || loadingRoles || !role || !canSubmit}
            className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
          >
            {loading ? "Saving..." : "Save User"}
          </button>
          <Link
            to="/users"
            className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Back to List
          </Link>
          {message ? (
            <button
              type="button"
              className="rounded-xl border border-[#9c4f46]/30 bg-white px-4 py-2.5 text-sm font-semibold"
              onClick={() => navigate("/users")}
            >
              Go to Users
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
