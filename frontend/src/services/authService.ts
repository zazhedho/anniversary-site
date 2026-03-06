import { apiRequest, clearToken, saveToken } from "./api";
import type {
  AuthUser,
  ChangePasswordPayload,
  GoogleLoginPayload,
  GoogleLoginResult,
  ForgotPasswordPayload,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from "../types/auth";
import type { PermissionGrant } from "../types/permission";

export async function login(payload: LoginPayload): Promise<string> {
  const response = await apiRequest<LoginResult>("/api/user/login", {
    method: "POST",
    body: payload,
  });

  const token = response.data?.token;
  if (!token) {
    throw new Error("Token tidak tersedia");
  }

  saveToken(token);
  return token;
}

export async function loginWithGoogle(payload: GoogleLoginPayload): Promise<GoogleLoginResult> {
  const response = await apiRequest<GoogleLoginResult>("/api/user/google/login", {
    method: "POST",
    body: payload,
  });

  const data = response.data;
  const token = data?.token;
  if (!token) {
    throw new Error("Token tidak tersedia");
  }

  saveToken(token);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<null>("/api/user/logout", {
      method: "POST",
      auth: true,
    });
  } finally {
    clearToken();
  }
}

export async function register(payload: RegisterPayload): Promise<void> {
  await apiRequest<null>("/api/user/register", {
    method: "POST",
    body: payload,
  });
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await apiRequest<null>("/api/user/forgot-password", {
    method: "POST",
    body: payload,
  });
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiRequest<null>("/api/user/reset-password", {
    method: "POST",
    body: payload,
  });
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiRequest<AuthUser>("/api/user", {
    auth: true,
  });

  if (!response.data) {
    throw new Error("User profile tidak tersedia");
  }

  return response.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const response = await apiRequest<AuthUser>("/api/user", {
    method: "PUT",
    auth: true,
    body: payload,
  });

  if (!response.data) {
    throw new Error("Gagal update profil");
  }

  return response.data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiRequest<null>("/api/user/change/password", {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export async function getMyPermissions(): Promise<PermissionGrant[]> {
  const response = await apiRequest<PermissionGrant[]>("/api/permissions/me", {
    auth: true,
  });

  return response.data || [];
}
