import { apiRequest } from "./api";
import type { PublicPayload, SetupAnnualMoment, SetupSiteConfig } from "../types/anniversary";

function setupHeaders(setupToken: string): Record<string, string> {
  const token = setupToken.trim();
  if (!token) {
    throw new Error("Setup token wajib diisi");
  }

  return {
    "X-Setup-Token": token,
  };
}

export async function getSetupConfig(setupToken: string): Promise<SetupSiteConfig> {
  const response = await apiRequest<SetupSiteConfig>("/api/setup/anniversary", {
    headers: setupHeaders(setupToken),
  });

  if (!response.data) {
    throw new Error("Data setup tidak tersedia");
  }

  return response.data;
}

export async function updateSetupConfig(setupToken: string, payload: SetupSiteConfig): Promise<PublicPayload> {
  const response = await apiRequest<PublicPayload>("/api/setup/anniversary", {
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
  payload: SetupAnnualMoment[]
): Promise<SetupAnnualMoment[]> {
  const response = await apiRequest<SetupAnnualMoment[]>("/api/setup/anniversary/moments", {
    method: "PUT",
    headers: setupHeaders(setupToken),
    body: payload,
  });

  return response.data || [];
}

export async function addSetupMoment(setupToken: string, payload: SetupAnnualMoment): Promise<SetupAnnualMoment[]> {
  const response = await apiRequest<SetupAnnualMoment[]>("/api/setup/anniversary/moments", {
    method: "POST",
    headers: setupHeaders(setupToken),
    body: payload,
  });

  return response.data || [];
}

export async function deleteSetupMoment(setupToken: string, year: number): Promise<SetupAnnualMoment[]> {
  const response = await apiRequest<SetupAnnualMoment[]>(`/api/setup/anniversary/moments/${year}`, {
    method: "DELETE",
    headers: setupHeaders(setupToken),
  });

  return response.data || [];
}
