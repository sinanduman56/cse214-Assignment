export interface User {
  id: number;
  email: string;
  roleType: string;
  gender: string;
  active: boolean;
  status?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  email: string;
  roleType: string;
  userId: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  roleType: string;
  gender: string;
}

export interface CurrentUser {
  userId: number;
  email: string;
  roleType: string;
  token: string;
  refreshToken: string;
}
