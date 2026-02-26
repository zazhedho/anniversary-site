export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions?: string[];
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type LoginResult = {
  token: string;
};

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
};

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  new_password: string;
};
