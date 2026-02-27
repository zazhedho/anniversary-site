import AnniversaryShowcase from "../../components/anniversary/AnniversaryShowcase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-[#6f332f]">{t("dashboard.tag")}</p>
        <h1 className="mt-1 font-display text-4xl leading-none">{t("dashboard.welcome", { name: user?.name || "User" })}</h1>
        <p className="mt-2 text-sm text-[#2b2220]/70">
          {t("dashboard.description")}
        </p>
      </div>
      <AnniversaryShowcase />
    </section>
  );
}
