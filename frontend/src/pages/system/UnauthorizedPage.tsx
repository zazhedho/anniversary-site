import { Link } from "react-router-dom";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";
import { useLanguage } from "../../contexts/LocaleContext";

export default function UnauthorizedPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen grid place-items-center bg-[#fff8f1] px-5">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <LanguageSwitcher />
        </div>
        <p className="font-display text-7xl text-[#9c4f46]">403</p>
        <p className="text-sm text-[#2b2220]/70">{t("system.unauthorized")}</p>
        <Link to="/anniversary" className="mt-4 inline-block rounded-full bg-[#9c4f46] px-4 py-2 text-sm font-semibold text-white">
          {t("system.backAnniversary")}
        </Link>
      </div>
    </main>
  );
}
