import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function ProfilePage() {
  const { user, updateCurrentUser, hasAccess } = useAuth();
  const canUpdateProfile = hasAccess({ resource: "profile", action: "update" });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
  }, [user]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      await updateCurrentUser({ name, email, phone });
      setMessage("Profil berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update profil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
      <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">Users</p>
        <h1 className="mt-2 font-display text-4xl leading-none">My Profile</h1>
        <div className="mt-4 space-y-2 text-sm">
          <p><span className="font-semibold">Role:</span> {user?.role || "-"}</p>
          <p><span className="font-semibold">Permissions:</span> {user?.permissions?.length || 0}</p>
          <p className="text-[#2b2220]/70">Endpoint: <code>GET /api/user</code>, <code>PUT /api/user</code></p>
          {!canUpdateProfile ? <p className="text-amber-700">Kamu hanya punya akses view profile.</p> : null}
        </div>
      </article>

      <form onSubmit={onSubmit} className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-5 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Name</span>
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
          <span className="mb-1 block text-sm font-semibold">Email</span>
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
          <span className="mb-1 block text-sm font-semibold">Phone</span>
          <input
            type="text"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
            disabled={!canUpdateProfile}
          />
        </label>

        {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={saving || !canUpdateProfile}
          className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </section>
  );
}
