import { apiRequest } from "./api";
import type { PublicPayload } from "../types/anniversary";
import type { Language } from "../contexts/LocaleContext";
import { resolveTenantSlug } from "../utils/tenantSlug";

function normalizeLanguage(language: Language): "id" | "en" {
  return language === "en" ? "en" : "id";
}

export async function fetchPublicAnniversary(language: Language, tenantSlug?: string): Promise<PublicPayload> {
  const lang = normalizeLanguage(language);
  const slug = resolveTenantSlug(tenantSlug);
  const response = await apiRequest<PublicPayload>(`/api/public/tenants/${encodeURIComponent(slug)}/anniversary?lang=${lang}`);

  if (!response.data) {
    throw new Error("Payload anniversary kosong");
  }

  return response.data;
}
