import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import SiteFooter from "./SiteFooter";

export default function AppLayout() {
  const { user, logoutUser, hasAccess, hasAnyAccess } = useAuth();
  const navigate = useNavigate();
  const canViewDashboard = hasAccess({ resource: "dashboard", action: "view" });
  const canListUsers = hasAccess({ resource: "users", action: "list" });
  const canViewProfile = hasAccess({ resource: "profile", action: "view" });
  const canChangePassword = hasAccess({ resource: "profile", action: "update_password" });
  const canSetupAnniversary = hasAccess({ resource: "dashboard", action: "view" });
  const canViewPublic = hasAnyAccess([
    { resource: "dashboard", action: "view" },
    { resource: "profile", action: "view" },
    { resource: "users", action: "list" },
  ]);
  const homePath = canViewDashboard ? "/dashboard" : canViewProfile ? "/profile" : "/anniversary";

  async function onLogout() {
    await logoutUser();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] text-[#2b2220]">
      <header className="border-b border-black/10 bg-white/55 backdrop-blur">
        <div className="mx-auto flex w-[min(1120px,94vw)] items-center justify-between py-4">
          <Link to={homePath} className="font-display text-3xl leading-none">Anniv Control</Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            {canViewDashboard ? (
              <NavLink to="/dashboard" className={({ isActive }) => `rounded-full px-3 py-1.5 ${isActive ? "bg-[#9c4f46] text-white" : "hover:bg-white/70"}`}>
                Dashboard
              </NavLink>
            ) : null}
            {canListUsers ? (
              <NavLink to="/users" className={({ isActive }) => `rounded-full px-3 py-1.5 ${isActive ? "bg-[#9c4f46] text-white" : "hover:bg-white/70"}`}>
                Users
              </NavLink>
            ) : null}
            {canSetupAnniversary ? (
              <NavLink to="/setup/anniversary" className={({ isActive }) => `rounded-full px-3 py-1.5 ${isActive ? "bg-[#9c4f46] text-white" : "hover:bg-white/70"}`}>
                Setup
              </NavLink>
            ) : null}
            {canViewPublic ? (
              <NavLink to="/anniversary" className={({ isActive }) => `rounded-full px-3 py-1.5 ${isActive ? "bg-[#9c4f46] text-white" : "hover:bg-white/70"}`}>
                Public
              </NavLink>
            ) : null}
            {canViewProfile ? (
              <NavLink to="/profile" className={({ isActive }) => `rounded-full px-3 py-1.5 ${isActive ? "bg-[#9c4f46] text-white" : "hover:bg-white/70"}`}>
                Profile
              </NavLink>
            ) : null}
            {canChangePassword ? (
              <NavLink to="/change-password" className={({ isActive }) => `rounded-full px-3 py-1.5 ${isActive ? "bg-[#9c4f46] text-white" : "hover:bg-white/70"}`}>
                Password
              </NavLink>
            ) : null}
            <button type="button" onClick={onLogout} className="ml-1 rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 hover:bg-white">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-[min(1120px,94vw)] flex-1 py-6">
        <p className="mb-4 text-xs uppercase tracking-[0.12em] text-[#2b2220]/60">Signed in as {user?.name || "User"}</p>
        <Outlet />
      </main>
      <div className="mx-auto w-[min(1120px,94vw)] pb-6">
        <SiteFooter />
      </div>
    </div>
  );
}
