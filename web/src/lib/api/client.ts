export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const AUTH_TOKEN_KEY = "ssc_auth_token";
export const AUTH_USER_KEY = "ssc_auth_user";

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredSession(token: string, user: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

export interface StoredUser {
  id?: number;
  name: string;
  email: string;
  role: "student" | "officer" | "admin" | string;
  student_id?: string | null;
  program?: string | null;
  college?: string | null;
  year_level?: string | null;
  position?: string | null;
  status?: string;
}

export function getStoredUser<T = StoredUser>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Ensures a valid Sanctum token is present in localStorage when a user visits
 * student or officer routes in local development.
 */
export async function ensureRoleToken(
  preferredRole: "student" | "officer" = "student"
): Promise<string | null> {
  const existingToken = getStoredToken();
  const existingUser = getStoredUser<{ role?: string }>();

  if (
    existingToken &&
    existingUser &&
    (existingUser.role === preferredRole ||
      (preferredRole === "officer" && existingUser.role === "admin"))
  ) {
    return existingToken;
  }

  try {
    const email =
      preferredRole === "officer"
        ? "officer@example.test"
        : "student@example.test";
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password: "password",
      }),
    });

    if (!res.ok) return existingToken;
    const payload = (await res.json()) as ApiEnvelope<{
      token: string;
      user: unknown;
    }>;
    if (payload.success && payload.data?.token) {
      setStoredSession(payload.data.token, payload.data.user);
      return payload.data.token;
    }
  } catch {
    // Backend may not be running during static build or offline preview
  }

  return existingToken;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  roleHint?: "student" | "officer";
  requireAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    roleHint,
    requireAuth = true,
    headers: customHeaders,
    ...rest
  } = options;

  let token = getStoredToken();
  if (requireAuth && roleHint) {
    token = await ensureRoleToken(roleHint);
  }

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(customHeaders as Record<string, string> | undefined),
  };

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...rest,
    headers,
    body: isFormData
      ? (body as FormData)
      : body !== undefined
      ? JSON.stringify(body)
      : undefined,
  });

  const json = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || (json && json.success === false)) {
    throw new ApiError(
      json?.message || `Request failed with HTTP ${response.status}`,
      response.status,
      json?.errors
    );
  }

  if (json && "data" in json) {
    return json.data;
  }

  return json as unknown as T;
}
