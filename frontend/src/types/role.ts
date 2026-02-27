export type RoleRecord = {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system?: boolean;
};

export type RoleDetail = RoleRecord & {
  permission_ids: string[];
  menu_ids: string[];
  created_at?: string;
  updated_at?: string;
};

export type RoleListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  order_by?: string;
  order_direction?: "asc" | "desc";
};

export type RoleCreatePayload = {
  name: string;
  display_name: string;
  description?: string;
};

export type RoleUpdatePayload = {
  display_name?: string;
  description?: string;
};

export type AssignPermissionsPayload = {
  permission_ids: string[];
};

export type AssignMenusPayload = {
  menu_ids: string[];
};
