import { apiPaginatedRequest, apiRequest } from "./api";
import type {
  TenantAssignMemberPayload,
  TenantCreatePayload,
  TenantDetail,
  TenantListQuery,
  TenantRecord,
  TenantUpdatePayload,
} from "../types/tenant";

function withQuery(path: string, query: TenantListQuery): string {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.order_by) params.set("order_by", query.order_by);
  if (query.order_direction) params.set("order_direction", query.order_direction);

  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

export async function getTenantsPage(query: TenantListQuery = {}) {
  return apiPaginatedRequest<TenantRecord[]>(withQuery("/api/tenants", query), {
    auth: true,
  });
}

export async function getTenantOptions(limit = 200): Promise<TenantRecord[]> {
  const response = await getTenantsPage({
    page: 1,
    limit,
    order_by: "created_at",
    order_direction: "asc",
  });
  return response.data || [];
}

export async function getTenantById(id: string): Promise<TenantDetail> {
  const response = await apiRequest<TenantDetail>(`/api/tenants/${id}`, {
    auth: true,
  });
  if (!response.data) {
    throw new Error("Tenant not found");
  }
  return response.data;
}

export async function createTenant(payload: TenantCreatePayload): Promise<TenantDetail> {
  const response = await apiRequest<TenantDetail>("/api/tenants", {
    method: "POST",
    auth: true,
    body: payload,
  });
  if (!response.data) {
    throw new Error("Failed to create tenant");
  }
  return response.data;
}

export async function updateTenant(id: string, payload: TenantUpdatePayload): Promise<TenantDetail> {
  const response = await apiRequest<TenantDetail>(`/api/tenants/${id}`, {
    method: "PATCH",
    auth: true,
    body: payload,
  });
  if (!response.data) {
    throw new Error("Failed to update tenant");
  }
  return response.data;
}

export async function deleteTenant(id: string): Promise<void> {
  await apiRequest<null>(`/api/tenants/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function addTenantMember(id: string, payload: TenantAssignMemberPayload) {
  const response = await apiRequest(`/api/tenants/${id}/members`, {
    method: "POST",
    auth: true,
    body: payload,
  });
  return response.data || [];
}
