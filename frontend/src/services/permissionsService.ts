import { apiPaginatedRequest } from "./api";
import type { PermissionGrant } from "../types/permission";

type PermissionListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  order_by?: string;
  order_direction?: "asc" | "desc";
};

function withQuery(path: string, query: PermissionListQuery): string {
  const params = new URLSearchParams();

  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.search) params.set("search", query.search);
  if (query.order_by) params.set("order_by", query.order_by);
  if (query.order_direction) params.set("order_direction", query.order_direction);

  const q = params.toString();
  return q ? `${path}?${q}` : path;
}

export async function getPermissions(query: PermissionListQuery = {}): Promise<PermissionGrant[]> {
  const response = await apiPaginatedRequest<PermissionGrant[]>(withQuery("/api/permissions", query), {
    auth: true,
  });

  return response.data || [];
}
