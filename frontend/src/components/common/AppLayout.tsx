import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import LanguageSwitcher from "./LanguageSwitcher";
import SiteFooter from "./SiteFooter";

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logoutUser, hasAccess, hasAnyAccess } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const canViewDashboard = hasAccess({ resource: "dashboard", action: "view" });
  const canListUsers = hasAccess({ resource: "users", action: "list" });
  const canListRoles = hasAccess({ resource: "roles", action: "list" });
  const canListMenus = hasAccess({ resource: "menus", action: "list" });
  const canOpenProfilePage = hasAnyAccess([
    { resource: "profile", action: "view" },
    { resource: "profile", action: "update_password" },
  ]);
  const canSetupAnniversary = hasAccess({ resource: "dashboard", action: "view" });
  const canViewPublic = hasAnyAccess([
    { resource: "dashboard", action: "view" },
    { resource: "profile", action: "view" },
    { resource: "users", action: "list" },
  ]);
  const homePath = canViewDashboard ? "/dashboard" : canOpenProfilePage ? "/profile" : "/anniversary";

  async function onLogout() {
    await logoutUser();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 ${isActive ? "bg-[#9c4f46] text-white" : "hover:bg-white/70"}`;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] text-[#2b2220]">
      <header className="border-b border-black/10 bg-white/55 backdrop-blur">
        <div className="mx-auto w-[min(1120px,94vw)] py-4">
          <div className="flex items-center justify-between">
            <Link to={homePath} className="font-display text-3xl leading-none">
              Anniv Control
            </Link>
            <div className="flex items-center gap-2 md:hidden">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 text-sm font-semibold hover:bg-white"
              >
                {mobileMenuOpen ? "Close" : "Menu"}
              </button>
            </div>
          </div>

          <nav className="mt-3 hidden flex-wrap items-center gap-2 text-sm md:flex">
            {canViewDashboard ? (
              <NavLink to="/dashboard" className={navItemClass}>
                {t("nav.dashboard")}
              </NavLink>
            ) : null}
            {canListUsers ? (
              <NavLink to="/users" className={navItemClass}>
                {t("nav.users")}
              </NavLink>
            ) : null}
            {canListRoles ? (
              <NavLink to="/roles" className={navItemClass}>
                {t("nav.roles")}
              </NavLink>
            ) : null}
            {canListMenus ? (
              <NavLink to="/menus" className={navItemClass}>
                {t("nav.menus")}
              </NavLink>
            ) : null}
            {canSetupAnniversary ? (
              <NavLink to="/setup/anniversary" className={navItemClass}>
                {t("nav.setup")}
              </NavLink>
            ) : null}
            {canViewPublic ? (
              <NavLink to="/anniversary" className={navItemClass}>
                {t("nav.public")}
              </NavLink>
            ) : null}
            {canOpenProfilePage ? (
              <NavLink to="/profile" className={navItemClass}>
                {t("nav.profile")}
              </NavLink>
            ) : null}
            <LanguageSwitcher />
            <button type="button" onClick={onLogout} className="ml-1 rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 hover:bg-white">
              {t("nav.logout")}
            </button>
          </nav>

          {mobileMenuOpen ? (
            <nav className="mt-3 grid gap-2 rounded-2xl border border-[#9c4f46]/15 bg-white/80 p-3 text-sm md:hidden">
              {canViewDashboard ? (
                <NavLink to="/dashboard" className={navItemClass}>
                  {t("nav.dashboard")}
                </NavLink>
              ) : null}
              {canListUsers ? (
                <NavLink to="/users" className={navItemClass}>
                  {t("nav.users")}
                </NavLink>
              ) : null}
              {canListRoles ? (
                <NavLink to="/roles" className={navItemClass}>
                  {t("nav.roles")}
                </NavLink>
              ) : null}
              {canListMenus ? (
                <NavLink to="/menus" className={navItemClass}>
                  {t("nav.menus")}
                </NavLink>
              ) : null}
              {canSetupAnniversary ? (
                <NavLink to="/setup/anniversary" className={navItemClass}>
                  {t("nav.setup")}
                </NavLink>
              ) : null}
              {canViewPublic ? (
                <NavLink to="/anniversary" className={navItemClass}>
                  {t("nav.public")}
                </NavLink>
              ) : null}
              {canOpenProfilePage ? (
                <NavLink to="/profile" className={navItemClass}>
                  {t("nav.profile")}
                </NavLink>
              ) : null}
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-left font-semibold hover:bg-white"
              >
                {t("nav.logout")}
              </button>
            </nav>
          ) : null}
        </div>
      </header>

      <main className="mx-auto w-[min(1120px,94vw)] flex-1 py-6">
        <p className="mb-4 text-xs uppercase tracking-[0.12em] text-[#2b2220]/60">{t("layout.signedInAs", { name: user?.name || "User" })}</p>
        <Outlet />
      </main>
      <div className="mx-auto w-[min(1120px,94vw)] pb-6">
        <SiteFooter />
      </div>
    </div>
  );
}
