import type {
  LocalizedText,
  SetupAnnualMoment,
  SetupMemoryCard,
  SetupSiteConfig,
  SetupTimelineItem,
} from "../../../types/anniversary";
import type { LocalizedForm, SetupForm } from "./types";

export function toTextPair(value: LocalizedText): LocalizedForm {
  if (typeof value === "string") {
    return { id: value, en: value };
  }

  const id = (value.id || "").trim();
  const en = (value.en || "").trim();

  if (id === "" && en === "") return { id: "", en: "" };
  if (id === "") return { id: en, en };
  if (en === "") return { id, en: id };

  return { id, en };
}

export function normalizeConfig(config: SetupSiteConfig): SetupForm {
  return {
    brand: toTextPair(config.brand),
    couple_names: toTextPair(config.couple_names),
    wedding_date: config.wedding_date || "",
    cover_badge: toTextPair(config.cover_badge),
    cover_title: toTextPair(config.cover_title),
    cover_subtext: toTextPair(config.cover_subtext),
    cover_cta: toTextPair(config.cover_cta),
    hero_title: toTextPair(config.hero_title),
    hero_subtext: toTextPair(config.hero_subtext),
    letter: toTextPair(config.letter),
    footer_text: toTextPair(config.footer_text),
    music_url: config.music_url || "",
    timeline: (config.timeline || []).map((item: SetupTimelineItem) => ({
      title: toTextPair(item.title),
      description: toTextPair(item.description),
    })),
    memory_cards: (config.memory_cards || []).map((item: SetupMemoryCard) => ({
      title: toTextPair(item.title),
      summary: toTextPair(item.summary),
      note: toTextPair(item.note),
    })),
    annual_moments: (config.annual_moments || []).map((item: SetupAnnualMoment) => ({
      year: Number(item.year) || 1,
      title: toTextPair(item.title),
      date: item.date || "",
      note: toTextPair(item.note),
    })),
  };
}

export function toPayload(form: SetupForm): SetupSiteConfig {
  return {
    brand: { id: form.brand.id, en: form.brand.en },
    couple_names: { id: form.couple_names.id, en: form.couple_names.en },
    wedding_date: form.wedding_date,
    cover_badge: { id: form.cover_badge.id, en: form.cover_badge.en },
    cover_title: { id: form.cover_title.id, en: form.cover_title.en },
    cover_subtext: { id: form.cover_subtext.id, en: form.cover_subtext.en },
    cover_cta: { id: form.cover_cta.id, en: form.cover_cta.en },
    hero_title: { id: form.hero_title.id, en: form.hero_title.en },
    hero_subtext: { id: form.hero_subtext.id, en: form.hero_subtext.en },
    letter: { id: form.letter.id, en: form.letter.en },
    footer_text: { id: form.footer_text.id, en: form.footer_text.en },
    music_url: form.music_url,
    timeline: form.timeline.map((item) => ({
      title: { id: item.title.id, en: item.title.en },
      description: { id: item.description.id, en: item.description.en },
    })),
    memory_cards: form.memory_cards.map((item) => ({
      title: { id: item.title.id, en: item.title.en },
      summary: { id: item.summary.id, en: item.summary.en },
      note: { id: item.note.id, en: item.note.en },
    })),
    annual_moments: form.annual_moments.map((item) => ({
      year: Number(item.year) || 1,
      title: { id: item.title.id, en: item.title.en },
      date: item.date,
      note: { id: item.note.id, en: item.note.en },
    })),
  };
}

export function toPrettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function parseConfigJson(source: string, invalidMessage: string): SetupSiteConfig {
  const parsed = JSON.parse(source) as SetupSiteConfig;
  if (!parsed || typeof parsed !== "object") {
    throw new Error(invalidMessage);
  }
  return parsed;
}
