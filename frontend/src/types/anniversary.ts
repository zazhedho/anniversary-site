export type LocalizedTextObject = {
  id?: string;
  en?: string;
};

export type LocalizedText = string | LocalizedTextObject;

export type PublicTimelineItem = {
  title: string;
  description: string;
};

export type PublicMemoryCard = {
  title: string;
  summary: string;
  note: string;
};

export type PublicGalleryPhoto = {
  id?: string;
  title: string;
  caption: string;
  image_url: string;
};

export type PublicGalleryVideo = {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  poster_url?: string;
};

export type PublicAnnualMoment = {
  year: number;
  title: string;
  date: string;
  note: string;
};

export type SetupTimelineItem = {
  title: LocalizedText;
  description: LocalizedText;
};

export type SetupMemoryCard = {
  title: LocalizedText;
  summary: LocalizedText;
  note: LocalizedText;
};

export type SetupGalleryPhoto = {
  id?: string;
  title: LocalizedText;
  caption: LocalizedText;
  image_url: string;
};

export type SetupGalleryVideo = {
  id?: string;
  title: LocalizedText;
  description: LocalizedText;
  video_url: string;
  poster_url?: string;
};

export type SetupAnnualMoment = {
  year: number;
  title: LocalizedText;
  date: string;
  note: LocalizedText;
};

export type AnnualMomentView = PublicAnnualMoment & {
  status: "done" | "today" | "upcoming";
};

export type PublicSiteConfig = {
  brand: string;
  couple_names: string;
  wedding_date: string;
  cover_badge: string;
  cover_title: string;
  cover_subtext: string;
  cover_cta: string;
  hero_title: string;
  hero_subtext: string;
  letter: string;
  footer_text: string;
  music_url: string;
  timeline: PublicTimelineItem[];
  memory_cards: PublicMemoryCard[];
  annual_moments: PublicAnnualMoment[];
  gallery_photos?: PublicGalleryPhoto[];
  gallery_videos?: PublicGalleryVideo[];
};

export type SetupSiteConfig = {
  brand: LocalizedText;
  couple_names: LocalizedText;
  wedding_date: string;
  cover_badge: LocalizedText;
  cover_title: LocalizedText;
  cover_subtext: LocalizedText;
  cover_cta: LocalizedText;
  hero_title: LocalizedText;
  hero_subtext: LocalizedText;
  letter: LocalizedText;
  footer_text: LocalizedText;
  music_url: string;
  timeline: SetupTimelineItem[];
  memory_cards: SetupMemoryCard[];
  annual_moments: SetupAnnualMoment[];
  gallery_photos?: SetupGalleryPhoto[];
  gallery_videos?: SetupGalleryVideo[];
};

export type NextAnniversary = {
  number: number;
  label: string;
  date: string;
  target_time: string;
  is_today: boolean;
};

export type PublicPayload = {
  config: PublicSiteConfig;
  next_anniversary: NextAnniversary;
  moments: AnnualMomentView[];
  timezone: string;
  server_time: string;
};
