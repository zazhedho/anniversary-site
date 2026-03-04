import type { ApiResponse, PaginatedApiResponse } from "../types/api";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
export const TOKEN_KEY = "anniv_auth_token";

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  auth?: boolean;
  body?: unknown;
  headers?: Record<string, string>;
};

type BaseResponse = {
  status: boolean;
  message: string;
};

async function request<R extends BaseResponse>(path: string, options: RequestOptions = {}): Promise<R> {
  const { method = "GET", auth = false, body, headers = {} } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: R;
  try {
    payload = (await response.json()) as R;
  } catch {
    payload = {
      status: false,
      message: "Invalid server response",
    } as R;
  }

  if (!response.ok || payload.status === false) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  return request<ApiResponse<T>>(path, options);
}

export async function apiPaginatedRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<PaginatedApiResponse<T>> {
  return request<PaginatedApiResponse<T>>(path, options);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return Boolean(getToken());
}
