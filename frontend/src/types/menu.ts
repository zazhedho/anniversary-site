export type MenuRecord = {
  id: string;
  name: string;
  display_name: string;
  path: string;
  icon?: string;
  parent_id?: string | null;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MenuListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  order_by?: string;
  order_direction?: "asc" | "desc";
};

export type MenuCreatePayload = {
  name: string;
  display_name: string;
  path: string;
  icon?: string;
  parent_id?: string | null;
  order_index?: number;
  is_active?: boolean;
};

export type MenuUpdatePayload = {
  display_name?: string;
  path?: string;
  icon?: string;
  parent_id?: string;
  order_index?: number;
  is_active?: boolean;
};
