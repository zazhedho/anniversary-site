import { apiRequest } from "./api";
import type { PublicPayload } from "../types/anniversary";

export async function fetchPublicAnniversary(): Promise<PublicPayload> {
  const response = await apiRequest<PublicPayload>("/api/public/anniversary");

  if (!response.data) {
    throw new Error("Payload anniversary kosong");
  }

  return response.data;
}
