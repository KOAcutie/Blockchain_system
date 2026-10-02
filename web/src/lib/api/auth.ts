import {
  apiRequest,
  clearStoredSession,
  getStoredUser,
  setStoredSession,
} from "./client";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  student_id: string | null;
  role: "student" | "officer" | "admin";
  role_label: string;
  status: string;
  college?: string | null;
  program?: string | null;
  year_level?: string | null;
  position?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
  student_id?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  student_id: string;
  password: string;
  password_confirmation: string;
  college?: string;
  program?: string;
  year_level?: string;
}

export interface AuthSessionResponse {
  user: AuthUser;
  token: string;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthSessionResponse> {
    const data = await apiRequest<AuthSessionResponse>("/auth/login", {
      method: "POST",
      body: payload,
      requireAuth: false,
    });
    setStoredSession(data.token, data.user);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthSessionResponse> {
    const data = await apiRequest<AuthSessionResponse>("/auth/register", {
      method: "POST",
      body: payload,
      requireAuth: false,
    });
    setStoredSession(data.token, data.user);
    return data;
  },

  async me(roleHint?: "student" | "officer"): Promise<AuthUser> {
    const data = await apiRequest<{ user?: AuthUser } & AuthUser>("/auth/me", {
      method: "GET",
      roleHint,
    });
    return data.user ?? data;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      clearStoredSession();
    }
  },

  getCurrentUser(): AuthUser | null {
    return getStoredUser<AuthUser>();
  },
};
