export type TenantRecord = {
  id: string;
  slug: string;
  name: string;
  status: "active" | "suspended" | string;
  member_count: number;
  created_at?: string;
  updated_at?: string;
};

export type TenantMemberRecord = {
  id: string;
  tenant_id: string;
  user_id: string;
  member_type: "owner" | "member" | string;
  user_name?: string;
  user_email?: string;
  created_at?: string;
  updated_at?: string;
};

export type TenantDetail = {
  tenant: TenantRecord;
  members: TenantMemberRecord[];
};

export type TenantListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  order_by?: string;
  order_direction?: "asc" | "desc";
};

export type TenantCreatePayload = {
  slug: string;
  name: string;
  status?: "active" | "suspended";
};

export type TenantUpdatePayload = {
  slug?: string;
  name?: string;
  status?: "active" | "suspended";
};

export type TenantAssignMemberPayload = {
  user_id: string;
  member_type?: "owner" | "member";
};
