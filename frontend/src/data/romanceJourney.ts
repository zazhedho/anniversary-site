import type { PublicSiteConfig } from "../types/anniversary";

export type JourneyPhoto = {
  id: string;
  title: string;
  caption: string;
  image_url: string;
};

export type JourneyVideo = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  poster_url?: string;
};

const fallbackPhotoUrls = [
  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=1400&q=80",
];

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function buildJourneyPhotos(config?: PublicSiteConfig): JourneyPhoto[] {
  const configured = (config?.gallery_photos || [])
    .map((item, index) => ({
      id: item.id || `photo-${index + 1}`,
      title: safeText(item.title),
      caption: safeText(item.caption),
      image_url: safeText(item.image_url),
    }))
    .filter((item) => item.image_url !== "");

  if (configured.length > 0) {
    return configured.map((item, index) => ({
      ...item,
      title: item.title || `Moment ${index + 1}`,
    }));
  }

  const memoryBased = (config?.memory_cards || []).slice(0, fallbackPhotoUrls.length).map((item, index) => ({
    id: `memory-${index + 1}`,
    title: safeText(item.title) || `Moment ${index + 1}`,
    caption: safeText(item.note) || safeText(item.summary),
    image_url: fallbackPhotoUrls[index % fallbackPhotoUrls.length],
  }));

  if (memoryBased.length > 0) {
    return memoryBased;
  }

  return fallbackPhotoUrls.map((url, index) => ({
    id: `fallback-${index + 1}`,
    title: `Moment ${index + 1}`,
    caption: "",
    image_url: url,
  }));
}

export function buildJourneyVideos(config?: PublicSiteConfig): JourneyVideo[] {
  return (config?.gallery_videos || [])
    .map((item, index) => ({
      id: item.id || `video-${index + 1}`,
      title: safeText(item.title) || `Video ${index + 1}`,
      description: safeText(item.description),
      video_url: safeText(item.video_url),
      poster_url: safeText(item.poster_url) || undefined,
    }))
    .filter((item) => item.video_url !== "");
}
