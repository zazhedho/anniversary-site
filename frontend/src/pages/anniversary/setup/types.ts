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

export type RootLocalizedKey = "brand" | "couple_names" | "hero_title" | "hero_subtext" | "letter" | "footer_text";

export type SetupForm = {
  brand: LocalizedForm;
  couple_names: LocalizedForm;
  wedding_date: string;
  hero_title: LocalizedForm;
  hero_subtext: LocalizedForm;
  letter: LocalizedForm;
  footer_text: LocalizedForm;
  music_url: string;
  timeline: TimelineFormItem[];
  memory_cards: MemoryFormItem[];
  annual_moments: MomentFormItem[];
};

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export const EMPTY_SETUP_FORM: SetupForm = {
  brand: { id: "", en: "" },
  couple_names: { id: "", en: "" },
  wedding_date: "",
  hero_title: { id: "", en: "" },
  hero_subtext: { id: "", en: "" },
  letter: { id: "", en: "" },
  footer_text: { id: "", en: "" },
  music_url: "",
  timeline: [],
  memory_cards: [],
  annual_moments: [],
};
