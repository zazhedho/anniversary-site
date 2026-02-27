import { apiPaginatedRequest, apiRequest } from "./api";
import type {
  AssignMenusPayload,
  AssignPermissionsPayload,
  RoleCreatePayload,
  RoleDetail,
  RoleListQuery,
  RoleRecord,
  RoleUpdatePayload,
} from "../types/role";

function withQuery(path: string, query: RoleListQuery): string {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.order_by) params.set("order_by", query.order_by);
  if (query.order_direction) params.set("order_direction", query.order_direction);

  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

export async function getRoles(query: RoleListQuery = {}): Promise<RoleRecord[]> {
  const response = await apiPaginatedRequest<RoleRecord[]>(withQuery("/api/roles", query), {
    auth: true,
  });

  return response.data || [];
}

export async function getRolesPage(query: RoleListQuery = {}) {
  return apiPaginatedRequest<RoleRecord[]>(withQuery("/api/roles", query), {
    auth: true,
  });
}

export async function getRoleById(id: string): Promise<RoleDetail> {
  const response = await apiRequest<RoleDetail>(`/api/role/${id}`, {
    auth: true,
  });

  if (!response.data) {
    throw new Error("Role tidak ditemukan");
  }

  return response.data;
}

export async function createRole(payload: RoleCreatePayload): Promise<RoleRecord> {
  const response = await apiRequest<RoleRecord>("/api/role", {
    method: "POST",
    auth: true,
    body: payload,
  });

  if (!response.data) {
    throw new Error("Gagal membuat role");
  }

  return response.data;
}

export async function updateRole(id: string, payload: RoleUpdatePayload): Promise<RoleRecord> {
  const response = await apiRequest<RoleRecord>(`/api/role/${id}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });

  if (!response.data) {
    throw new Error("Gagal memperbarui role");
  }

  return response.data;
}

export async function deleteRole(id: string): Promise<void> {
  await apiRequest<null>(`/api/role/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function assignRolePermissions(id: string, payload: AssignPermissionsPayload): Promise<void> {
  await apiRequest<null>(`/api/role/${id}/permissions`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export async function assignRoleMenus(id: string, payload: AssignMenusPayload): Promise<void> {
  await apiRequest<null>(`/api/role/${id}/menus`, {
    method: "POST",
    auth: true,
    body: payload,
  });
}
