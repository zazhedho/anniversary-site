import { Link } from "react-router-dom";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";
import SiteFooter from "../../components/common/SiteFooter";
import { useLanguage } from "../../contexts/LocaleContext";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen flex-col bg-[#fff8f1] px-5 py-8">
      <div className="grid flex-1 place-items-center">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <LanguageSwitcher />
          </div>
          <p className="font-display text-7xl text-[#9c4f46]">404</p>
          <p className="text-sm text-[#2b2220]/70">{t("system.notFound")}</p>
          <Link to="/app/dashboard" className="mt-4 inline-block rounded-full bg-[#9c4f46] px-4 py-2 text-sm font-semibold text-white">
            {t("system.backDashboard")}
          </Link>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <SiteFooter />
      </div>
    </main>
  );
}
