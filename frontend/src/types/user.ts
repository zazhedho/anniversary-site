export type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
};

export type UserListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  order_by?: string;
  order_direction?: "asc" | "desc";
};

export type AdminCreateUserPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
};

export type UpdateUserByIdPayload = {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
};
