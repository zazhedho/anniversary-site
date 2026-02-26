import { apiPaginatedRequest } from "./api";
import type { RoleListQuery, RoleRecord } from "../types/role";

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
