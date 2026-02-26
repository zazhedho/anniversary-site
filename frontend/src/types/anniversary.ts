export type TimelineItem = {
  title: string;
  description: string;
};

export type MemoryCard = {
  title: string;
  summary: string;
  note: string;
};

export type AnnualMomentConfig = {
  year: number;
  title: string;
  date: string;
  note: string;
};

export type AnnualMomentView = AnnualMomentConfig & {
  status: "done" | "today" | "upcoming";
};

export type SiteConfig = {
  brand: string;
  couple_names: string;
  wedding_date: string;
  hero_title: string;
  hero_subtext: string;
  letter: string;
  footer_text: string;
  music_url: string;
  timeline: TimelineItem[];
  memory_cards: MemoryCard[];
  annual_moments: AnnualMomentConfig[];
};

export type NextAnniversary = {
  number: number;
  label: string;
  date: string;
  target_time: string;
  is_today: boolean;
};

export type PublicPayload = {
  config: SiteConfig;
  next_anniversary: NextAnniversary;
  moments: AnnualMomentView[];
  timezone: string;
  server_time: string;
};
