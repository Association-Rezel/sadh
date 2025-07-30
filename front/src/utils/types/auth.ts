import { User } from "./types";

export interface AuthStatusResponse<T = JwtUserData | User> {
  logged_in: boolean;
  user?: T;
}

export interface JwtUserData {
  username: string;
  email: string;
  iat: number;
}

export interface BackendAuthSuccessResponse {
    status: string;
    session_type: 'user' | 'admin';
    user: JwtUserData;
}

export interface BackendErrorResponse {
    detail: string;
}

export type AuthCallbackStatus = 'loading' | 'success' | 'error';

export interface LogoutResponse {
  user_cleared: boolean;
  admin_cleared: boolean;
}