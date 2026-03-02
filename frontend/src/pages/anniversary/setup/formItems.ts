import type { GalleryPhotoFormItem, GalleryVideoFormItem } from "./types";

export function emptyPhotoFormItem(index: number): GalleryPhotoFormItem {
  return {
    id: `photo-${index + 1}`,
    title: { id: "", en: "" },
    caption: { id: "", en: "" },
    image_url: "",
  };
}

export function emptyVideoFormItem(index: number): GalleryVideoFormItem {
  return {
    id: `video-${index + 1}`,
    title: { id: "", en: "" },
    description: { id: "", en: "" },
    video_url: "",
    poster_url: "",
  };
}
