import type { EditLanguage, GalleryPhotoFormItem, GalleryVideoFormItem, TranslateFn } from "../types";
import { setupFieldLimits } from "../fieldLimits";

type SetupGallerySectionProps = {
  t: TranslateFn;
  editLanguage: EditLanguage;
  galleryPhotos: GalleryPhotoFormItem[];
  galleryVideos: GalleryVideoFormItem[];
  uploadingPhotoIndex: number | null;
  uploadingVideoIndex: number | null;
  uploadingPosterIndex: number | null;
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  onPhotoLocalizedFieldChange: (index: number, key: "title" | "caption", value: string) => void;
  onPhotoFieldChange: (index: number, key: "id" | "image_url", value: string) => void;
  onUploadPhoto: (index: number, file: File) => Promise<void>;
  onAddVideo: () => void;
  onRemoveVideo: (index: number) => void;
  onVideoLocalizedFieldChange: (index: number, key: "title" | "description", value: string) => void;
  onVideoFieldChange: (index: number, key: "id" | "video_url" | "poster_url", value: string) => void;
  onUploadVideo: (index: number, file: File) => Promise<void>;
  onUploadPoster: (index: number, file: File) => Promise<void>;
};

export default function SetupGallerySection({
  t,
  editLanguage,
  galleryPhotos,
  galleryVideos,
  uploadingPhotoIndex,
  uploadingVideoIndex,
  uploadingPosterIndex,
  onAddPhoto,
  onRemovePhoto,
  onPhotoLocalizedFieldChange,
  onPhotoFieldChange,
  onUploadPhoto,
  onAddVideo,
  onRemoveVideo,
  onVideoLocalizedFieldChange,
  onVideoFieldChange,
  onUploadVideo,
  onUploadPoster,
}: SetupGallerySectionProps) {
  return (
    <article className="space-y-4 rounded-2xl border border-[#9c4f46]/20 bg-white/65 p-4">
      <div>
        <p className="text-sm font-semibold">{t("setup.sectionGallery")}</p>
        <p className="text-xs text-[#2b2220]/70">{t("setup.sectionGalleryHint")}</p>
      </div>

      <div className="space-y-3 rounded-xl border border-[#9c4f46]/15 bg-white/80 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{t("setup.galleryPhotos")}</p>
            <p className="text-xs text-[#2b2220]/70">{t("setup.galleryPhotosHint")}</p>
          </div>
          <button type="button" onClick={onAddPhoto} className="rounded-xl border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold">
            {t("setup.addPhoto")}
          </button>
        </div>

        {galleryPhotos.length === 0 ? <p className="text-sm text-[#2b2220]/65">{t("setup.emptyPhotos")}</p> : null}
        {galleryPhotos.map((item, index) => (
          <div key={`photo-${index}`} className="space-y-2 rounded-xl border border-[#9c4f46]/15 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f332f]">{t("setup.itemNumber", { number: index + 1 })}</p>
              <button type="button" onClick={() => onRemovePhoto(index)} className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                {t("setup.removeItem")}
              </button>
            </div>

            <input
              type="text"
              value={item.id}
              onChange={(event) => onPhotoFieldChange(index, "id", event.target.value)}
              maxLength={setupFieldLimits.galleryId}
              placeholder={t("setup.placeholder.photoId")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
            <input
              type="text"
              value={item.title[editLanguage]}
              onChange={(event) => onPhotoLocalizedFieldChange(index, "title", event.target.value)}
              maxLength={setupFieldLimits.galleryTitle}
              placeholder={t("setup.placeholder.photoTitle")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
            <input
              type="text"
              value={item.caption[editLanguage]}
              onChange={(event) => onPhotoLocalizedFieldChange(index, "caption", event.target.value)}
              maxLength={setupFieldLimits.galleryCaption}
              placeholder={t("setup.placeholder.photoCaption")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
            <input
              type="text"
              value={item.image_url}
              onChange={(event) => onPhotoFieldChange(index, "image_url", event.target.value)}
              maxLength={setupFieldLimits.mediaUrl}
              placeholder={t("setup.placeholder.photoUrl")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#9c4f46]/30 bg-white px-3 py-2 text-xs font-semibold text-[#6f332f]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void onUploadPhoto(index, file);
                  event.currentTarget.value = "";
                }}
              />
              {uploadingPhotoIndex === index ? t("setup.uploading") : t("setup.uploadPhoto")}
            </label>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-[#9c4f46]/15 bg-white/80 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{t("setup.galleryVideos")}</p>
            <p className="text-xs text-[#2b2220]/70">{t("setup.galleryVideosHint")}</p>
          </div>
          <button type="button" onClick={onAddVideo} className="rounded-xl border border-[#9c4f46]/30 bg-white px-3 py-1.5 text-xs font-semibold">
            {t("setup.addVideo")}
          </button>
        </div>

        {galleryVideos.length === 0 ? <p className="text-sm text-[#2b2220]/65">{t("setup.emptyVideos")}</p> : null}
        {galleryVideos.map((item, index) => (
          <div key={`video-${index}`} className="space-y-2 rounded-xl border border-[#9c4f46]/15 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6f332f]">{t("setup.itemNumber", { number: index + 1 })}</p>
              <button type="button" onClick={() => onRemoveVideo(index)} className="rounded-lg border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                {t("setup.removeItem")}
              </button>
            </div>

            <input
              type="text"
              value={item.id}
              onChange={(event) => onVideoFieldChange(index, "id", event.target.value)}
              maxLength={setupFieldLimits.galleryId}
              placeholder={t("setup.placeholder.videoId")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
            <input
              type="text"
              value={item.title[editLanguage]}
              onChange={(event) => onVideoLocalizedFieldChange(index, "title", event.target.value)}
              maxLength={setupFieldLimits.galleryTitle}
              placeholder={t("setup.placeholder.videoTitle")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
            <textarea
              value={item.description[editLanguage]}
              onChange={(event) => onVideoLocalizedFieldChange(index, "description", event.target.value)}
              maxLength={setupFieldLimits.galleryDescription}
              placeholder={t("setup.placeholder.videoDescription")}
              className="min-h-[80px] w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
            <input
              type="text"
              value={item.video_url}
              onChange={(event) => onVideoFieldChange(index, "video_url", event.target.value)}
              maxLength={setupFieldLimits.mediaUrl}
              placeholder={t("setup.placeholder.videoUrl")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />
            <input
              type="text"
              value={item.poster_url}
              onChange={(event) => onVideoFieldChange(index, "poster_url", event.target.value)}
              maxLength={setupFieldLimits.mediaUrl}
              placeholder={t("setup.placeholder.posterUrl")}
              className="w-full rounded-xl border border-[#9c4f46]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#9c4f46]"
            />

            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#9c4f46]/30 bg-white px-3 py-2 text-xs font-semibold text-[#6f332f]">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void onUploadVideo(index, file);
                    event.currentTarget.value = "";
                  }}
                />
                {uploadingVideoIndex === index ? t("setup.uploading") : t("setup.uploadVideo")}
              </label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#9c4f46]/30 bg-white px-3 py-2 text-xs font-semibold text-[#6f332f]">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void onUploadPoster(index, file);
                    event.currentTarget.value = "";
                  }}
                />
                {uploadingPosterIndex === index ? t("setup.uploading") : t("setup.uploadPoster")}
              </label>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
