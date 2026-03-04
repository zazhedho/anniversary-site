import { Link, useParams } from "react-router-dom";
import AnniversaryShowcase from "../../components/anniversary/AnniversaryShowcase";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";
import SiteFooter from "../../components/common/SiteFooter";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { buildPublicTenantPath, resolveTenantSlug } from "../../utils/tenantSlug";

export default function PublicAnniversaryShowcasePage() {
  const { slug } = useParams<{ slug?: string }>();
  const tenantSlug = resolveTenantSlug(slug);
  const { isAuthenticated, loading, hasAccess } = useAuth();
  const { t } = useLanguage();
  const canViewDashboard = hasAccess({ resource: "dashboard", action: "view" });
  const canViewProfile = hasAccess({ resource: "profile", action: "view" });
  const homePath = buildPublicTenantPath(tenantSlug, "home");
  const authDestination = canViewDashboard ? "/app/dashboard" : canViewProfile ? "/app/profile" : homePath;
  const authLabel = canViewDashboard ? t("public.dashboard") : t("nav.profile");

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff9f3] via-[#ffece1] to-[#f5d4c8] px-5 py-6 text-[#2b2220]">
      <div className="mx-auto w-full max-w-[1120px] flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6f332f]">{t("public.tag")}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <LanguageSwitcher className="align-middle" />
            <Link to={homePath} className="rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 font-semibold">
              {t("public.startJourney")}
            </Link>
            {!loading ? (
              isAuthenticated ? (
                <Link to={authDestination} className="rounded-full bg-[#9c4f46] px-3 py-1.5 font-semibold text-white">
                  {authLabel}
                </Link>
              ) : (
                <Link to="/app/login" className="rounded-full border border-[#9c4f46]/30 bg-white/70 px-3 py-1.5 font-semibold">
                  {t("public.login")}
                </Link>
              )
            ) : null}
          </div>
        </div>

        <AnniversaryShowcase tenantSlug={tenantSlug} />
      </div>
      <div className="mx-auto w-full max-w-[1120px]">
        <SiteFooter className="mt-6" />
      </div>
    </main>
  );
}
