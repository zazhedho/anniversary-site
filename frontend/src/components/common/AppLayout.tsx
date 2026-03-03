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

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const desktopNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 ${isActive ? "bg-[#9c4f46] text-white" : "hover:bg-white/70"}`;
  const mobileNavItemClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-xl px-4 py-2.5 font-semibold ${isActive ? "bg-[#9c4f46] text-white" : "border border-[#9c4f46]/20 bg-white text-[#2b2220]"}`;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] text-[#2b2220]">
      <header className="border-b border-black/10 bg-white/55 backdrop-blur">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link to={homePath} className="font-display text-3xl leading-none">
              Anniv Control
            </Link>
            <nav className="hidden flex-wrap items-center justify-end gap-2 text-sm md:flex">
              {canViewDashboard ? (
                <NavLink to="/dashboard" className={desktopNavItemClass}>
                  {t("nav.dashboard")}
                </NavLink>
              ) : null}
              {canListUsers ? (
                <NavLink to="/users" className={desktopNavItemClass}>
                  {t("nav.users")}
                </NavLink>
              ) : null}
              {canListRoles ? (
                <NavLink to="/roles" className={desktopNavItemClass}>
                  {t("nav.roles")}
                </NavLink>
              ) : null}
              {canListMenus ? (
                <NavLink to="/menus" className={desktopNavItemClass}>
                  {t("nav.menus")}
                </NavLink>
              ) : null}
              {canSetupAnniversary ? (
                <NavLink to="/setup/anniversary" className={desktopNavItemClass}>
                  {t("nav.setup")}
                </NavLink>
              ) : null}
              {canViewPublic ? (
                <NavLink to="/anniversary" className={desktopNavItemClass}>
                  {t("nav.public")}
                </NavLink>
              ) : null}
              {canOpenProfilePage ? (
                <NavLink to="/profile" className={desktopNavItemClass}>
                  {t("nav.profile")}
                </NavLink>
              ) : null}
              <LanguageSwitcher />
              <button type="button" onClick={onLogout} className="ml-1 rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 hover:bg-white">
                {t("nav.logout")}
              </button>
            </nav>
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 py-6">
        <p className="mb-4 text-xs uppercase tracking-[0.12em] text-[#2b2220]/60">{t("layout.signedInAs", { name: user?.name || "User" })}</p>
        <Outlet />
      </main>
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-6">
        <SiteFooter />
      </div>

      <div className={`fixed inset-0 z-50 md:hidden ${mobileMenuOpen ? "" : "pointer-events-none"}`} aria-hidden={!mobileMenuOpen}>
        <button
          type="button"
          aria-label="Close menu backdrop"
          onClick={() => setMobileMenuOpen(false)}
          className={`absolute inset-0 bg-[#2b2220]/45 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <section
          className={`absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-[#9c4f46]/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,239,230,0.96))] p-4 shadow-[0_-18px_40px_rgba(43,34,32,0.22)] transition-transform duration-300 ${mobileMenuOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#9c4f46]/25" />
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#6f332f]">Navigation</p>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full border border-[#9c4f46]/25 bg-white px-3 py-1 text-xs font-semibold"
            >
              Close
            </button>
          </div>

          <nav className="grid gap-2 pb-1 text-sm">
            {canViewDashboard ? (
              <NavLink to="/dashboard" className={mobileNavItemClass}>
                {t("nav.dashboard")}
              </NavLink>
            ) : null}
            {canListUsers ? (
              <NavLink to="/users" className={mobileNavItemClass}>
                {t("nav.users")}
              </NavLink>
            ) : null}
            {canListRoles ? (
              <NavLink to="/roles" className={mobileNavItemClass}>
                {t("nav.roles")}
              </NavLink>
            ) : null}
            {canListMenus ? (
              <NavLink to="/menus" className={mobileNavItemClass}>
                {t("nav.menus")}
              </NavLink>
            ) : null}
            {canSetupAnniversary ? (
              <NavLink to="/setup/anniversary" className={mobileNavItemClass}>
                {t("nav.setup")}
              </NavLink>
            ) : null}
            {canViewPublic ? (
              <NavLink to="/anniversary" className={mobileNavItemClass}>
                {t("nav.public")}
              </NavLink>
            ) : null}
            {canOpenProfilePage ? (
              <NavLink to="/profile" className={mobileNavItemClass}>
                {t("nav.profile")}
              </NavLink>
            ) : null}
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-[#9c4f46]/20 bg-white px-4 py-2.5 text-left font-semibold text-[#2b2220]"
            >
              {t("nav.logout")}
            </button>
          </nav>
        </section>
      </div>
    </div>
  );
}
