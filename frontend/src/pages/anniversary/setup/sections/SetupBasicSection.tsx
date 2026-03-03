import type { RootLocalizedKey, SetupForm, TranslateFn, EditLanguage } from "../types";

type SetupBasicSectionProps = {
  t: TranslateFn;
  form: SetupForm;
  editLanguage: EditLanguage;
  saving: boolean;
  tokenMissing: boolean;
  onLocalizedFieldChange: (key: RootLocalizedKey, value: string) => void;
  onWeddingDateChange: (value: string) => void;
  onMusicUrlChange: (value: string) => void;
  onUploadMusic: (file: File) => void;
  uploadingMusic: boolean;
  onVoiceNoteUrlChange: (value: string) => void;
  onUploadVoice: (file: File) => void;
  uploadingVoice: boolean;
};

export default function SetupBasicSection({
  t,
  form,
  editLanguage,
  saving,
  tokenMissing,
  onLocalizedFieldChange,
  onWeddingDateChange,
  onMusicUrlChange,
  onUploadMusic,
  uploadingMusic,
  onVoiceNoteUrlChange,
  onUploadVoice,
  uploadingVoice,
}: SetupBasicSectionProps) {
  return (
    <article className="rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{t("setup.sectionBasic")}</p>
          <p className="text-xs text-[#2b2220]/70">{t("setup.sectionBasicHint")}</p>
        </div>
        <button
          type="submit"
          disabled={tokenMissing || saving}
          className="rounded-xl bg-gradient-to-r from-[#9c4f46] to-[#6f332f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? t("setup.saving") : t("setup.saveAll")}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.brand")}</span>
          <input
            type="text"
            value={form.brand[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("brand", event.target.value)}
            placeholder={t("setup.placeholder.brand")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.coupleNames")}</span>
          <input
            type="text"
            value={form.couple_names[editLanguage]}
            onChange={(event) => onLocalizedFieldChange("couple_names", event.target.value)}
            placeholder={t("setup.placeholder.coupleNames")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.weddingDate")}</span>
          <input
            type="date"
            value={form.wedding_date}
            onChange={(event) => onWeddingDateChange(event.target.value)}
            placeholder={t("setup.placeholder.weddingDate")}
            title={t("setup.placeholder.weddingDate")}
            className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t("setup.musicUrl")}</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={form.music_url}
              onChange={(event) => onMusicUrlChange(event.target.value)}
              placeholder={t("setup.placeholder.musicUrl")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            />
            <label
              className={`inline-flex items-center justify-center rounded-xl border border-[#9c4f46]/25 bg-white px-3 py-2 text-sm font-semibold text-[#2b2220] ${tokenMissing || uploadingMusic ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[#fff5ef]"}`}
            >
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                disabled={tokenMissing || uploadingMusic}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUploadMusic(file);
                  event.currentTarget.value = "";
                }}
              />
              {uploadingMusic ? t("setup.uploading") : t("setup.uploadMusic")}
            </label>
          </div>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold">{t("setup.voiceNoteUrl")}</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={form.voice_note_url}
              onChange={(event) => onVoiceNoteUrlChange(event.target.value)}
              placeholder={t("setup.placeholder.voiceNoteUrl")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#9c4f46]"
            />
            <label
              className={`inline-flex items-center justify-center rounded-xl border border-[#9c4f46]/25 bg-white px-3 py-2 text-sm font-semibold text-[#2b2220] ${tokenMissing || uploadingVoice ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[#fff5ef]"}`}
            >
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                disabled={tokenMissing || uploadingVoice}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUploadVoice(file);
                  event.currentTarget.value = "";
                }}
              />
              {uploadingVoice ? t("setup.uploading") : t("setup.uploadVoice")}
            </label>
          </div>
        </label>
      </div>
    </article>
  );
}
