import { apiRequest } from "./api";
import type { PublicPayload } from "../types/anniversary";
import type { Language } from "../contexts/LocaleContext";

function normalizeLanguage(language: Language): "id" | "en" {
  return language === "en" ? "en" : "id";
}

export async function fetchPublicAnniversary(language: Language): Promise<PublicPayload> {
  const lang = normalizeLanguage(language);
  const response = await apiRequest<PublicPayload>(`/api/public/anniversary?lang=${lang}`);

  if (!response.data) {
    throw new Error("Payload anniversary kosong");
  }

  return response.data;
}
