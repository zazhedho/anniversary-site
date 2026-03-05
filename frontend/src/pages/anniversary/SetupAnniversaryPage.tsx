import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LocaleContext";
import { useNotification } from "../../contexts/NotificationContext";
import { getSetupConfig, updateSetupConfig, uploadSetupMedia } from "../../services/setupService";
import { emptyPhotoFormItem, emptyVideoFormItem } from "./setup/formItems";
import { normalizeConfig, parseConfigJson, toPayload, toPrettyJson } from "./setup/mapper";
import SetupAdvancedJsonSection from "./setup/sections/SetupAdvancedJsonSection";
import SetupAccessCard from "./setup/sections/SetupAccessCard";
import SetupBasicSection from "./setup/sections/SetupBasicSection";
import SetupGallerySection from "./setup/sections/SetupGallerySection";
import SetupHeaderCard from "./setup/sections/SetupHeaderCard";
import SetupLanguageCard from "./setup/sections/SetupLanguageCard";
import SetupMemoriesSection from "./setup/sections/SetupMemoriesSection";
import SetupMapSection from "./setup/sections/SetupMapSection";
import SetupMomentsSection from "./setup/sections/SetupMomentsSection";
import SetupSaveSection from "./setup/sections/SetupSaveSection";
import SetupStorySection from "./setup/sections/SetupStorySection";
import SetupTimelineSection from "./setup/sections/SetupTimelineSection";
import SetupScrollToSaveButton from "./setup/sections/SetupScrollToSaveButton";
import { normalizeTenantSlug, normalizeTenantSlugInput } from "../../utils/tenantSlug";
import { setupFieldLimits } from "./setup/fieldLimits";
import type {
  EditLanguage,
  MemoryFormItem,
  MomentFormItem,
  RootLocalizedKey,
  SetupForm,
  TimelineFormItem,
} from "./setup/types";
import { EMPTY_SETUP_FORM } from "./setup/types";

const SETUP_TENANT_SLUG_KEY = "anniv_setup_tenant_slug";
const MAX_YEAR_VALUE = 9999;

const ROOT_LOCALIZED_LIMITS: Record<RootLocalizedKey, number> = {
  brand: setupFieldLimits.brand,
  couple_names: setupFieldLimits.coupleNames,
  cover_badge: setupFieldLimits.coverBadge,
  cover_title: setupFieldLimits.coverTitle,
  cover_subtext: setupFieldLimits.coverSubtext,
  cover_cta: setupFieldLimits.coverCTA,
  hero_title: setupFieldLimits.heroTitle,
  hero_subtext: setupFieldLimits.heroSubtext,
  letter: setupFieldLimits.letter,
  footer_text: setupFieldLimits.footerText,
};

function clampText(value: string, maxLength: number): string {
  return value.slice(0, maxLength);
}

export default function SetupAnniversaryPage() {
  const { activeTenantSlug, availableTenants } = useAuth();
  const { t, language } = useLanguage();
  const { notifyError, notifySuccess } = useNotification();

  const [tenantSlug, setTenantSlug] = useState("default");
  const [editLanguage, setEditLanguage] = useState<EditLanguage>(language);
  const [form, setForm] = useState<SetupForm>(EMPTY_SETUP_FORM);
  const [advancedJson, setAdvancedJson] = useState("{}");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
  const [uploadingVideoIndex, setUploadingVideoIndex] = useState<number | null>(null);
  const [uploadingPosterIndex, setUploadingPosterIndex] = useState<number | null>(null);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const tenantOptions = useMemo(
    () =>
      availableTenants
        .map((tenant) => ({
          slug: normalizeTenantSlug(tenant.slug),
          name: tenant.name?.trim() || tenant.slug,
        }))
        .filter((tenant, index, arr) => tenant.slug !== "" && arr.findIndex((item) => item.slug === tenant.slug) === index),
    [availableTenants]
  );

  useEffect(() => {
    const savedTenantSlug = normalizeTenantSlug(localStorage.getItem(SETUP_TENANT_SLUG_KEY) || "");
    const activeSlug = normalizeTenantSlug(activeTenantSlug);
    const allowedSlugs = tenantOptions.map((tenant) => tenant.slug);
    const fallbackSlug = allowedSlugs[0] || activeSlug || "default";
    const preferredSlug =
      (savedTenantSlug && allowedSlugs.includes(savedTenantSlug) && savedTenantSlug) ||
      (activeSlug && allowedSlugs.includes(activeSlug) && activeSlug) ||
      fallbackSlug;

    setTenantSlug((previous) => {
      const currentSlug = normalizeTenantSlug(previous);
      const nextSlug = currentSlug && allowedSlugs.includes(currentSlug) ? currentSlug : preferredSlug;
      return nextSlug && nextSlug !== previous ? nextSlug : previous;
    });
  }, [activeTenantSlug, tenantOptions]);

  useEffect(() => {
    const normalized = normalizeTenantSlug(tenantSlug);
    if (normalized) {
      localStorage.setItem(SETUP_TENANT_SLUG_KEY, normalized);
    }
  }, [tenantSlug]);

  useEffect(() => {
    setEditLanguage(language);
  }, [language]);

  useEffect(() => {
    setAdvancedJson(toPrettyJson(toPayload(form)));
  }, [form]);

  function setLocalizedField(key: RootLocalizedKey, value: string) {
    const nextValue = clampText(value, ROOT_LOCALIZED_LIMITS[key]);
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [editLanguage]: nextValue,
      },
    }));
  }

  function setTimelineField(index: number, key: keyof TimelineFormItem, value: string) {
    const maxLength = key === "title" ? setupFieldLimits.timelineTitle : setupFieldLimits.timelineDescription;
    const nextValue = clampText(value, maxLength);
    setForm((prev) => {
      const next = [...prev.timeline];
      next[index] = {
        ...next[index],
        [key]: {
          ...next[index][key],
          [editLanguage]: nextValue,
        },
      };
      return { ...prev, timeline: next };
    });
  }

  function setMemoryField(index: number, key: keyof MemoryFormItem, value: string) {
    const memoryFieldLimits: Record<keyof MemoryFormItem, number> = {
      title: setupFieldLimits.memoryTitle,
      summary: setupFieldLimits.memorySummary,
      note: setupFieldLimits.memoryNote,
    };
    const nextValue = clampText(value, memoryFieldLimits[key]);
    setForm((prev) => {
      const next = [...prev.memory_cards];
      next[index] = {
        ...next[index],
        [key]: {
          ...next[index][key],
          [editLanguage]: nextValue,
        },
      };
      return { ...prev, memory_cards: next };
    });
  }

  function setMapPointLocalizedField(index: number, key: "title" | "note", value: string) {
    const maxLength = key === "title" ? setupFieldLimits.mapTitle : setupFieldLimits.mapNote;
    const nextValue = clampText(value, maxLength);
    setForm((prev) => {
      const next = [...prev.map_points];
      next[index] = {
        ...next[index],
        [key]: {
          ...next[index][key],
          [editLanguage]: nextValue,
        },
      };
      return { ...prev, map_points: next };
    });
  }

  function setMapPointCoordinateField(index: number, key: "lat" | "lng", value: string) {
    const nextValue = clampText(value, setupFieldLimits.mapCoordinate);
    setForm((prev) => {
      const next = [...prev.map_points];
      next[index] = {
        ...next[index],
        [key]: nextValue,
      };
      return { ...prev, map_points: next };
    });
  }

  function setMomentField(index: number, key: keyof MomentFormItem, value: string | number) {
    setForm((prev) => {
      const next = [...prev.annual_moments];
      if (key === "year") {
        const parsedYear = Number(value) || 1;
        next[index] = { ...next[index], year: Math.min(MAX_YEAR_VALUE, Math.max(1, parsedYear)) };
      } else if (key === "date") {
        next[index] = { ...next[index], date: String(value) };
      } else {
        const localizedKey = key as "title" | "note";
        const maxLength = localizedKey === "title" ? setupFieldLimits.momentTitle : setupFieldLimits.momentNote;
        next[index] = {
          ...next[index],
          [localizedKey]: {
            ...next[index][localizedKey],
            [editLanguage]: clampText(String(value), maxLength),
          },
        };
      }
      return { ...prev, annual_moments: next };
    });
  }

  function setGalleryPhotoLocalizedField(index: number, key: "title" | "caption", value: string) {
    const maxLength = key === "title" ? setupFieldLimits.galleryTitle : setupFieldLimits.galleryCaption;
    const nextValue = clampText(value, maxLength);
    setForm((prev) => {
      const next = [...prev.gallery_photos];
      next[index] = {
        ...next[index],
        [key]: {
          ...next[index][key],
          [editLanguage]: nextValue,
        },
      };
      return { ...prev, gallery_photos: next };
    });
  }

  function setGalleryPhotoField(index: number, key: "id" | "image_url", value: string) {
    const maxLength = key === "id" ? setupFieldLimits.galleryId : setupFieldLimits.mediaUrl;
    const nextValue = clampText(value, maxLength);
    setForm((prev) => {
      const next = [...prev.gallery_photos];
      next[index] = {
        ...next[index],
        [key]: nextValue,
      };
      return { ...prev, gallery_photos: next };
    });
  }

  function setGalleryVideoLocalizedField(index: number, key: "title" | "description", value: string) {
    const maxLength = key === "title" ? setupFieldLimits.galleryTitle : setupFieldLimits.galleryDescription;
    const nextValue = clampText(value, maxLength);
    setForm((prev) => {
      const next = [...prev.gallery_videos];
      next[index] = {
        ...next[index],
        [key]: {
          ...next[index][key],
          [editLanguage]: nextValue,
        },
      };
      return { ...prev, gallery_videos: next };
    });
  }

  function setGalleryVideoField(index: number, key: "id" | "video_url" | "poster_url", value: string) {
    const maxLength = key === "id" ? setupFieldLimits.galleryId : setupFieldLimits.mediaUrl;
    const nextValue = clampText(value, maxLength);
    setForm((prev) => {
      const next = [...prev.gallery_videos];
      next[index] = {
        ...next[index],
        [key]: nextValue,
      };
      return { ...prev, gallery_videos: next };
    });
  }

  function addTimeline() {
    setForm((prev) => ({
      ...prev,
      timeline: [...prev.timeline, { title: { id: "", en: "" }, description: { id: "", en: "" } }],
    }));
  }

  function addMemory() {
    setForm((prev) => ({
      ...prev,
      memory_cards: [...prev.memory_cards, { title: { id: "", en: "" }, summary: { id: "", en: "" }, note: { id: "", en: "" } }],
    }));
  }

  function addMoment() {
    setForm((prev) => ({
      ...prev,
      annual_moments: [
        ...prev.annual_moments,
        {
          year: prev.annual_moments.length + 1,
          title: { id: "", en: "" },
          date: "",
          note: { id: "", en: "" },
        },
      ],
    }));
  }

  function addMapPoint() {
    setForm((prev) => ({
      ...prev,
      map_points: [...prev.map_points, { title: { id: "", en: "" }, note: { id: "", en: "" }, lat: "", lng: "" }],
    }));
  }

  function addPhoto() {
    setForm((prev) => ({
      ...prev,
      gallery_photos: [...prev.gallery_photos, emptyPhotoFormItem(prev.gallery_photos.length)],
    }));
  }

  function addVideo() {
    setForm((prev) => ({
      ...prev,
      gallery_videos: [...prev.gallery_videos, emptyVideoFormItem(prev.gallery_videos.length)],
    }));
  }

  function removeTimeline(index: number) {
    setForm((prev) => ({ ...prev, timeline: prev.timeline.filter((_, idx) => idx !== index) }));
  }

  function removeMemory(index: number) {
    setForm((prev) => ({ ...prev, memory_cards: prev.memory_cards.filter((_, idx) => idx !== index) }));
  }

  function removeMoment(index: number) {
    setForm((prev) => ({ ...prev, annual_moments: prev.annual_moments.filter((_, idx) => idx !== index) }));
  }
  function removeMapPoint(index: number) {
    setForm((prev) => ({ ...prev, map_points: prev.map_points.filter((_, idx) => idx !== index) }));
  }

  function removePhoto(index: number) {
    setForm((prev) => ({ ...prev, gallery_photos: prev.gallery_photos.filter((_, idx) => idx !== index) }));
  }

  function removeVideo(index: number) {
    setForm((prev) => ({ ...prev, gallery_videos: prev.gallery_videos.filter((_, idx) => idx !== index) }));
  }

  function requireTenantSlug(): string | null {
    const normalized = normalizeTenantSlug(tenantSlug);
    const allowed = tenantOptions.some((tenant) => tenant.slug === normalized);
    if (!normalized || !allowed) {
      const text = t("setup.tenantSelectRequired");
      setError(text);
      notifyError(text);
      return null;
    }
    return normalized;
  }

  async function loadConfig() {
    const selectedSlug = requireTenantSlug();
    if (!selectedSlug) return;

    setMessage("");
    setError("");
    setFetching(true);

    try {
      const config = await getSetupConfig(selectedSlug);
      const normalized = normalizeConfig(config);
      setForm(normalized);
      const text = t("setup.configLoaded");
      setMessage(text);
      notifySuccess(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : t("setup.configLoadFailed");
      setError(text);
      notifyError(text);
    } finally {
      setFetching(false);
    }
  }

  async function onSaveConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedSlug = requireTenantSlug();
    if (!selectedSlug) return;

    setMessage("");
    setError("");
    setSaving(true);

    try {
      await updateSetupConfig(toPayload(form), selectedSlug);
      const text = t("setup.configSaved");
      setMessage(text);
      notifySuccess(text);
    } catch (err) {
      const text = err instanceof Error ? err.message : t("setup.configSaveFailed");
      setError(text);
      notifyError(text);
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(index: number, file: File) {
    const selectedSlug = requireTenantSlug();
    if (!selectedSlug) return;

    setUploadingPhotoIndex(index);
    try {
      const result = await uploadSetupMedia(file, "photo", selectedSlug);
      setGalleryPhotoField(index, "image_url", result.url);
      notifySuccess(t("setup.uploadSuccess"));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : t("setup.uploadFailed"));
    } finally {
      setUploadingPhotoIndex(null);
    }
  }

  async function uploadVideo(index: number, file: File) {
    const selectedSlug = requireTenantSlug();
    if (!selectedSlug) return;

    setUploadingVideoIndex(index);
    try {
      const result = await uploadSetupMedia(file, "video", selectedSlug);
      setGalleryVideoField(index, "video_url", result.url);
      notifySuccess(t("setup.uploadSuccess"));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : t("setup.uploadFailed"));
    } finally {
      setUploadingVideoIndex(null);
    }
  }

  async function uploadPoster(index: number, file: File) {
    const selectedSlug = requireTenantSlug();
    if (!selectedSlug) return;

    setUploadingPosterIndex(index);
    try {
      const result = await uploadSetupMedia(file, "poster", selectedSlug);
      setGalleryVideoField(index, "poster_url", result.url);
      notifySuccess(t("setup.uploadSuccess"));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : t("setup.uploadFailed"));
    } finally {
      setUploadingPosterIndex(null);
    }
  }

  async function uploadVoice(file: File) {
    const selectedSlug = requireTenantSlug();
    if (!selectedSlug) return;

    setUploadingVoice(true);
    try {
      const result = await uploadSetupMedia(file, "audio", selectedSlug);
      setForm((prev) => ({ ...prev, voice_note_url: result.url }));
      notifySuccess(t("setup.uploadSuccess"));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : t("setup.uploadFailed"));
    } finally {
      setUploadingVoice(false);
    }
  }

  async function uploadMusic(file: File) {
    const selectedSlug = requireTenantSlug();
    if (!selectedSlug) return;

    setUploadingMusic(true);
    try {
      const result = await uploadSetupMedia(file, "audio", selectedSlug);
      setForm((prev) => ({ ...prev, music_url: result.url }));
      notifySuccess(t("setup.uploadSuccess"));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : t("setup.uploadFailed"));
    } finally {
      setUploadingMusic(false);
    }
  }

  function applyJsonToForm() {
    try {
      const parsed = parseConfigJson(advancedJson, t("setup.invalidJson"));
      setForm(normalizeConfig(parsed));
      notifySuccess(t("setup.jsonApplied"));
    } catch (err) {
      const text = err instanceof Error ? err.message : t("setup.invalidJson");
      notifyError(text);
    }
  }

  function scrollToSaveSection() {
    const saveAnchor = document.getElementById("setup-save-anchor");
    if (saveAnchor) {
      saveAnchor.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <section className="space-y-4">
      <SetupHeaderCard t={t} />
      <SetupAccessCard
        t={t}
        tenantSlug={tenantSlug}
        tenantOptions={tenantOptions}
        fetching={fetching}
        onTenantSlugChange={(value) => setTenantSlug(clampText(normalizeTenantSlugInput(value), setupFieldLimits.tenantSlug))}
        onLoadConfig={loadConfig}
      />
      <SetupLanguageCard t={t} editLanguage={editLanguage} onChangeLanguage={setEditLanguage} />
      {message ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <form onSubmit={onSaveConfig} className="space-y-4">
        <SetupBasicSection
          t={t}
          form={form}
          editLanguage={editLanguage}
          saving={saving}
          onLocalizedFieldChange={setLocalizedField}
          onWeddingDateChange={(value) => setForm((prev) => ({ ...prev, wedding_date: value }))}
          onMusicUrlChange={(value) => setForm((prev) => ({ ...prev, music_url: clampText(value, setupFieldLimits.musicUrl) }))}
          onUploadMusic={uploadMusic}
          uploadingMusic={uploadingMusic}
          onVoiceNoteUrlChange={(value) => setForm((prev) => ({ ...prev, voice_note_url: clampText(value, setupFieldLimits.voiceNoteUrl) }))}
          onUploadVoice={uploadVoice}
          uploadingVoice={uploadingVoice}
        />
        <SetupStorySection t={t} form={form} editLanguage={editLanguage} onLocalizedFieldChange={setLocalizedField} />
        <SetupTimelineSection
          t={t}
          editLanguage={editLanguage}
          timeline={form.timeline}
          onAddTimeline={addTimeline}
          onRemoveTimeline={removeTimeline}
          onTimelineFieldChange={setTimelineField}
        />
        <SetupMemoriesSection
          t={t}
          editLanguage={editLanguage}
          memoryCards={form.memory_cards}
          onAddMemory={addMemory}
          onRemoveMemory={removeMemory}
          onMemoryFieldChange={setMemoryField}
        />
        <SetupMapSection
          t={t}
          editLanguage={editLanguage}
          mapPoints={form.map_points}
          onAddMapPoint={addMapPoint}
          onRemoveMapPoint={removeMapPoint}
          onMapPointLocalizedFieldChange={setMapPointLocalizedField}
          onMapPointCoordinateChange={setMapPointCoordinateField}
        />
        <SetupMomentsSection
          t={t}
          editLanguage={editLanguage}
          annualMoments={form.annual_moments}
          onAddMoment={addMoment}
          onRemoveMoment={removeMoment}
          onMomentFieldChange={setMomentField}
        />
        <SetupGallerySection
          t={t}
          editLanguage={editLanguage}
          galleryPhotos={form.gallery_photos}
          galleryVideos={form.gallery_videos}
          uploadingPhotoIndex={uploadingPhotoIndex}
          uploadingVideoIndex={uploadingVideoIndex}
          uploadingPosterIndex={uploadingPosterIndex}
          onAddPhoto={addPhoto}
          onRemovePhoto={removePhoto}
          onPhotoLocalizedFieldChange={setGalleryPhotoLocalizedField}
          onPhotoFieldChange={setGalleryPhotoField}
          onUploadPhoto={uploadPhoto}
          onAddVideo={addVideo}
          onRemoveVideo={removeVideo}
          onVideoLocalizedFieldChange={setGalleryVideoLocalizedField}
          onVideoFieldChange={setGalleryVideoField}
          onUploadVideo={uploadVideo}
          onUploadPoster={uploadPoster}
        />
        <div id="setup-save-anchor">
          <SetupSaveSection t={t} saving={saving} />
        </div>
      </form>
      <SetupAdvancedJsonSection
        t={t}
        advancedJson={advancedJson}
        onAdvancedJsonChange={(value) => setAdvancedJson(clampText(value, setupFieldLimits.advancedJson))}
        onApplyJson={applyJsonToForm}
        onRefreshJson={() => setAdvancedJson(toPrettyJson(toPayload(form)))}
      />
      <SetupScrollToSaveButton onClick={scrollToSaveSection} />
    </section>
  );
}
