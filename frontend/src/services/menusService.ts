import { apiPaginatedRequest, apiRequest } from "./api";
import type { MenuCreatePayload, MenuListQuery, MenuRecord, MenuUpdatePayload } from "../types/menu";

function withQuery(path: string, query: MenuListQuery): string {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.order_by) params.set("order_by", query.order_by);
  if (query.order_direction) params.set("order_direction", query.order_direction);

  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

export async function getMenus(query: MenuListQuery = {}) {
  return apiPaginatedRequest<MenuRecord[]>(withQuery("/api/menus", query), {
    auth: true,
  });
}

export async function getMenuById(id: string): Promise<MenuRecord> {
  const response = await apiRequest<MenuRecord>(`/api/menu/${id}`, {
    auth: true,
  });
  if (!response.data) {
    throw new Error("Menu tidak ditemukan");
  }
  return response.data;
}

export async function createMenu(payload: MenuCreatePayload): Promise<MenuRecord> {
  const response = await apiRequest<MenuRecord>("/api/menu", {
    method: "POST",
    auth: true,
    body: payload,
  });
  if (!response.data) {
    throw new Error("Gagal membuat menu");
  }
  return response.data;
}

export async function updateMenu(id: string, payload: MenuUpdatePayload): Promise<MenuRecord> {
  const response = await apiRequest<MenuRecord>(`/api/menu/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
  if (!response.data) {
    throw new Error("Gagal memperbarui menu");
  }
  return response.data;
}

export async function deleteMenu(id: string): Promise<void> {
  await apiRequest<null>(`/api/menu/${id}`, {
    method: "DELETE",
    auth: true,
  });
}
