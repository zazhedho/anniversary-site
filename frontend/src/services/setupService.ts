import { apiRequest } from "./api";
import type { PublicPayload, SetupAnnualMoment, SetupSiteConfig } from "../types/anniversary";
import { normalizeTenantSlug } from "../utils/tenantSlug";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function setupHeaders(setupToken: string): Record<string, string> {
  const token = setupToken.trim();
  if (!token) {
    throw new Error("Setup token wajib diisi");
  }

  return {
    "X-Setup-Token": token,
  };
}

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

export type SetupUploadType = "photo" | "video" | "poster" | "audio";

export type SetupUploadResponse = {
  url: string;
  type: SetupUploadType;
  mime_type: string;
  size: number;
  filename: string;
};

function setupAnniversaryPath(tenantSlug?: string): string {
  const slug = normalizeTenantSlug(tenantSlug);
  if (!slug) return "/api/setup/anniversary";
  return `/api/setup/tenants/${encodeURIComponent(slug)}/anniversary`;
}

function setupMomentsPath(tenantSlug?: string): string {
  return `${setupAnniversaryPath(tenantSlug)}/moments`;
}

function setupMediaUploadPath(tenantSlug?: string): string {
  return `${setupAnniversaryPath(tenantSlug)}/media/upload`;
}

export async function getSetupConfig(setupToken: string, tenantSlug?: string): Promise<SetupSiteConfig> {
  const response = await apiRequest<SetupSiteConfig>(setupAnniversaryPath(tenantSlug), {
    headers: setupHeaders(setupToken),
  });

  if (!response.data) {
    throw new Error("Data setup tidak tersedia");
  }

  return response.data;
}

export async function updateSetupConfig(setupToken: string, payload: SetupSiteConfig, tenantSlug?: string): Promise<PublicPayload> {
  const response = await apiRequest<PublicPayload>(setupAnniversaryPath(tenantSlug), {
    method: "PUT",
    headers: setupHeaders(setupToken),
    body: payload,
  });

  if (!response.data) {
    throw new Error("Gagal update setup config");
  }

  return response.data;
}

export async function replaceSetupMoments(
  setupToken: string,
  payload: SetupAnnualMoment[],
  tenantSlug?: string
): Promise<SetupAnnualMoment[]> {
  const response = await apiRequest<SetupAnnualMoment[]>(setupMomentsPath(tenantSlug), {
    method: "PUT",
    headers: setupHeaders(setupToken),
    body: payload,
  });

  return response.data || [];
}

export async function addSetupMoment(setupToken: string, payload: SetupAnnualMoment, tenantSlug?: string): Promise<SetupAnnualMoment[]> {
  const response = await apiRequest<SetupAnnualMoment[]>(setupMomentsPath(tenantSlug), {
    method: "POST",
    headers: setupHeaders(setupToken),
    body: payload,
  });

  return response.data || [];
}

export async function deleteSetupMoment(setupToken: string, year: number, tenantSlug?: string): Promise<SetupAnnualMoment[]> {
  const response = await apiRequest<SetupAnnualMoment[]>(`${setupMomentsPath(tenantSlug)}/${year}`, {
    method: "DELETE",
    headers: setupHeaders(setupToken),
  });

  return response.data || [];
}

export async function uploadSetupMedia(
  setupToken: string,
  file: File,
  type: SetupUploadType,
  tenantSlug?: string
): Promise<SetupUploadResponse> {
  const payload = new FormData();
  payload.append("file", file);
  payload.append("type", type);

  const response = await fetch(buildUrl(setupMediaUploadPath(tenantSlug)), {
    method: "POST",
    headers: setupHeaders(setupToken),
    body: payload,
  });

  const result = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: SetupUploadResponse;
  };

  if (!response.ok || result.status === false || !result.data) {
    throw new Error(result.message || "Upload media gagal");
  }

  return result.data;
}
