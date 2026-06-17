import { HttpClient } from '@/network/http-client';
import { COOKIE_KEYS } from '@/shared/constants/cookie-keys.constant';
import { setCookie, deleteCookie } from '@/shared/utils/cookies';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface MessageResponse {
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  email: string;
  message: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendCodePayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export interface GoogleLoginPayload {
  idToken: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await HttpClient.post<AuthResponse, LoginCredentials>('/auth/login', credentials, {
      includeToken: false,
    });

    await setCookie(COOKIE_KEYS.ACCESS_TOKEN, data.accessToken);

    return data;
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return HttpClient.post<RegisterResponse, RegisterPayload>('/auth/register', payload, {
      includeToken: false,
    });
  },

  async verifyEmail(payload: VerifyEmailPayload): Promise<AuthResponse> {
    const data = await HttpClient.post<AuthResponse, VerifyEmailPayload>('/auth/verify-email', payload, {
      includeToken: false,
    });

    await setCookie(COOKIE_KEYS.ACCESS_TOKEN, data.accessToken);

    return data;
  },

  async resendCode(payload: ResendCodePayload): Promise<MessageResponse> {
    return HttpClient.post<MessageResponse, ResendCodePayload>('/auth/resend-code', payload, {
      includeToken: false,
    });
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<MessageResponse> {
    return HttpClient.post<MessageResponse, ForgotPasswordPayload>('/auth/forgot-password', payload, {
      includeToken: false,
    });
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<MessageResponse> {
    return HttpClient.post<MessageResponse, ResetPasswordPayload>('/auth/reset-password', payload, {
      includeToken: false,
    });
  },

  async googleLogin(payload: GoogleLoginPayload): Promise<AuthResponse> {
    const data = await HttpClient.post<AuthResponse, GoogleLoginPayload>('/auth/google', payload, {
      includeToken: false,
    });

    await setCookie(COOKIE_KEYS.ACCESS_TOKEN, data.accessToken);

    return data;
  },

  async logout(): Promise<void> {
    await deleteCookie(COOKIE_KEYS.ACCESS_TOKEN);
  },
};
