import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import AnniversaryShowcase from "../../components/anniversary/AnniversaryShowcase";
import { useLanguage } from "../../contexts/LocaleContext";
import { readSetupPreviewPayload } from "./setup/previewStorage";

export default function SetupAnniversaryPreviewPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const previewVersion = searchParams.get("v") || "0";
  const rawScale = Number.parseFloat(searchParams.get("s") || "1");
  const previewScale = Number.isFinite(rawScale) ? Math.min(1, Math.max(0.75, rawScale)) : 1;
  const previewWidthPercent = `${(100 / previewScale).toFixed(2)}%`;

  const payload = useMemo(() => readSetupPreviewPayload(), [previewVersion]);

  if (!payload) {
    return (
      <main className="min-h-screen bg-[#fff3eb] px-3 py-4 text-[#2b2220]">
        <p className="rounded-xl border border-[#9c4f46]/20 bg-white/75 p-3 text-sm">{t("setup.preview.frameEmpty")}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fff3eb] py-2">
      <div className="flex w-full justify-center">
        <div style={{ width: previewWidthPercent, transform: `scale(${previewScale})`, transformOrigin: "top center" }}>
          <AnniversaryShowcase previewPayload={payload} isSetupPreview />
        </div>
      </div>
    </main>
  );
}
