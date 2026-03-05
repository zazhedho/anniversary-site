import type { PublicPayload } from "../../../types/anniversary";

export const SETUP_PREVIEW_STORAGE_KEY = "anniv_setup_preview_payload";

export function writeSetupPreviewPayload(payload: PublicPayload): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETUP_PREVIEW_STORAGE_KEY, JSON.stringify(payload));
}

export function readSetupPreviewPayload(): PublicPayload | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SETUP_PREVIEW_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PublicPayload;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.config || !parsed.next_anniversary || !Array.isArray(parsed.moments)) return null;
    return parsed;
  } catch {
    return null;
  }
}
