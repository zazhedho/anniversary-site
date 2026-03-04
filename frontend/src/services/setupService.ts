import { apiRequest, getAuthToken } from "./api";
import type { PublicPayload, SetupAnnualMoment, SetupSiteConfig } from "../types/anniversary";
import { normalizeTenantSlug } from "../utils/tenantSlug";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

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

export async function getSetupConfig(tenantSlug?: string): Promise<SetupSiteConfig> {
  const response = await apiRequest<SetupSiteConfig>(setupAnniversaryPath(tenantSlug), {
    auth: true,
  });

  if (!response.data) {
    throw new Error("Data setup tidak tersedia");
  }

  return response.data;
}

export async function updateSetupConfig(payload: SetupSiteConfig, tenantSlug?: string): Promise<PublicPayload> {
  const response = await apiRequest<PublicPayload>(setupAnniversaryPath(tenantSlug), {
    method: "PUT",
    auth: true,
    body: payload,
  });

  if (!response.data) {
    throw new Error("Gagal update setup config");
  }

  return response.data;
}

export async function replaceSetupMoments(
  payload: SetupAnnualMoment[],
  tenantSlug?: string
): Promise<SetupAnnualMoment[]> {
  const response = await apiRequest<SetupAnnualMoment[]>(setupMomentsPath(tenantSlug), {
    method: "PUT",
    auth: true,
    body: payload,
  });

  return response.data || [];
}

export async function addSetupMoment(payload: SetupAnnualMoment, tenantSlug?: string): Promise<SetupAnnualMoment[]> {
  const response = await apiRequest<SetupAnnualMoment[]>(setupMomentsPath(tenantSlug), {
    method: "POST",
    auth: true,
    body: payload,
  });

  return response.data || [];
}

export async function deleteSetupMoment(year: number, tenantSlug?: string): Promise<SetupAnnualMoment[]> {
  const response = await apiRequest<SetupAnnualMoment[]>(`${setupMomentsPath(tenantSlug)}/${year}`, {
    method: "DELETE",
    auth: true,
  });

  return response.data || [];
}

export async function uploadSetupMedia(
  file: File,
  type: SetupUploadType,
  tenantSlug?: string
): Promise<SetupUploadResponse> {
  const payload = new FormData();
  payload.append("file", file);
  payload.append("type", type);

  const token = getAuthToken();
  if (!token) {
    throw new Error("Sesi login tidak ditemukan");
  }

  const response = await fetch(buildUrl(setupMediaUploadPath(tenantSlug)), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
