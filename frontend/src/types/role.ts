export type RoleRecord = {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system?: boolean;
};

export type RoleListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  order_by?: string;
  order_direction?: "asc" | "desc";
};
