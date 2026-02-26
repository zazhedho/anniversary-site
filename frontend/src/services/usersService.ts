import { apiPaginatedRequest, apiRequest } from "./api";
import type { AdminCreateUserPayload, UpdateUserByIdPayload, UserListQuery, UserRecord } from "../types/user";

function withQuery(path: string, query: UserListQuery): string {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.role) params.set("filters[role]", query.role);
  if (query.order_by) params.set("order_by", query.order_by);
  if (query.order_direction) params.set("order_direction", query.order_direction);

  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

export async function getUsers(query: UserListQuery = {}) {
  return apiPaginatedRequest<UserRecord[]>(withQuery("/api/users", query), {
    auth: true,
  });
}

export async function getUserById(id: string): Promise<UserRecord> {
  const response = await apiRequest<UserRecord>(`/api/user/${id}`, {
    auth: true,
  });

  if (!response.data) {
    throw new Error("Data user tidak ditemukan");
  }

  return response.data;
}

export async function createUser(payload: AdminCreateUserPayload): Promise<UserRecord> {
  const response = await apiRequest<UserRecord>("/api/user", {
    method: "POST",
    auth: true,
    body: payload,
  });

  if (!response.data) {
    throw new Error("Gagal membuat user");
  }

  return response.data;
}

export async function updateUserById(id: string, payload: UpdateUserByIdPayload): Promise<UserRecord> {
  const response = await apiRequest<UserRecord>(`/api/user/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });

  if (!response.data) {
    throw new Error("Gagal memperbarui user");
  }

  return response.data;
}
