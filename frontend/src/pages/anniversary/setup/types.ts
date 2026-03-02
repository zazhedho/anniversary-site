export type EditLanguage = "id" | "en";

export type LocalizedForm = {
  id: string;
  en: string;
};

export type TimelineFormItem = {
  title: LocalizedForm;
  description: LocalizedForm;
};

export type MemoryFormItem = {
  title: LocalizedForm;
  summary: LocalizedForm;
  note: LocalizedForm;
};

export type MomentFormItem = {
  year: number;
  title: LocalizedForm;
  date: string;
  note: LocalizedForm;
};

export type GalleryPhotoFormItem = {
  id: string;
  title: LocalizedForm;
  caption: LocalizedForm;
  image_url: string;
};

export type GalleryVideoFormItem = {
  id: string;
  title: LocalizedForm;
  description: LocalizedForm;
  video_url: string;
  poster_url: string;
};

export type RootLocalizedKey =
  | "brand"
  | "couple_names"
  | "cover_badge"
  | "cover_title"
  | "cover_subtext"
  | "cover_cta"
  | "hero_title"
  | "hero_subtext"
  | "letter"
  | "footer_text";

export type SetupForm = {
  brand: LocalizedForm;
  couple_names: LocalizedForm;
  wedding_date: string;
  cover_badge: LocalizedForm;
  cover_title: LocalizedForm;
  cover_subtext: LocalizedForm;
  cover_cta: LocalizedForm;
  hero_title: LocalizedForm;
  hero_subtext: LocalizedForm;
  letter: LocalizedForm;
  footer_text: LocalizedForm;
  music_url: string;
  voice_note_url: string;
  timeline: TimelineFormItem[];
  memory_cards: MemoryFormItem[];
  gallery_photos: GalleryPhotoFormItem[];
  gallery_videos: GalleryVideoFormItem[];
  annual_moments: MomentFormItem[];
};

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export const EMPTY_SETUP_FORM: SetupForm = {
  brand: { id: "", en: "" },
  couple_names: { id: "", en: "" },
  wedding_date: "",
  cover_badge: { id: "", en: "" },
  cover_title: { id: "", en: "" },
  cover_subtext: { id: "", en: "" },
  cover_cta: { id: "", en: "" },
  hero_title: { id: "", en: "" },
  hero_subtext: { id: "", en: "" },
  letter: { id: "", en: "" },
  footer_text: { id: "", en: "" },
  music_url: "",
  voice_note_url: "",
  timeline: [],
  memory_cards: [],
  gallery_photos: [],
  gallery_videos: [],
  annual_moments: [],
};
